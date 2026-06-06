import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import { adminApi } from "../../api/adminApi.js";

const API_ORIGIN = "http://localhost:8080";

const getFileUrl = (link) => {
    if (!link) return "";

    if (link.startsWith("http://") || link.startsWith("https://")) {
        return link;
    }

    return `${API_ORIGIN}/uploads/posts/${link}`;
};

const formatDateTime = (value) => {
    if (!value) return "Chưa có";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getVisibilityText = (hanCheHienThi) => {
    const numberValue = Number(hanCheHienThi);

    if (numberValue === 0) return "Mọi độ tuổi";
    if (numberValue === 1) return "Nội dung 18+";
    if (numberValue === 2) return "Nội dung bạo lực / máu me";
    if (numberValue === 99) return "Đã tạm ẩn";

    return `Không xác định (${hanCheHienThi})`;
};

export default function AdminPostList() {
    const [filters, setFilters] = useState({
        postId: "",
        hanCheHienThi: "ALL",
    });

    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1); // FE hiển thị từ trang 1
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPosts = useCallback(async (targetPage = page) => {
        try {
            setIsLoading(true);

            const response = await adminApi.searchPosts({
                postId: filters.postId,
                hanCheHienThi: filters.hanCheHienThi,
                page: targetPage - 1, // BE dùng page từ 0
                size: 6,
            });

            const result = response.data?.result;

            setPosts(result?.content || []);
            setTotalPages(result?.totalPages || 1);
            setTotalElements(result?.totalElements || 0);
        } catch (error) {
            console.error("Lỗi tìm kiếm Post admin:", error);
            setPosts([]);
            setTotalPages(1);
            setTotalElements(0);
        } finally {
            setIsLoading(false);
        }
    }, [filters.hanCheHienThi, filters.postId, page]);

    useEffect(() => {
        const fetchTimer = window.setTimeout(() => {
            fetchPosts(page);
        }, 0);

        return () => window.clearTimeout(fetchTimer);
    }, [fetchPosts, page]);

    const handleSearch = (event) => {
        event.preventDefault();

        if (page === 1) {
            fetchPosts(1);
            return;
        }

        setPage(1);
    };

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Kiểm duyệt Post</h1>

                <p className="mt-2 text-sm text-main-text/60">
                    Tìm kiếm Post theo mã bài viết và trạng thái hạn chế hiển thị.
                </p>

                <form
                    onSubmit={handleSearch}
                    className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
                >
                    <input
                        value={filters.postId}
                        onChange={(event) =>
                            setFilters((prev) => ({
                                ...prev,
                                postId: event.target.value,
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="Post ID"
                    />

                    <select
                        value={filters.hanCheHienThi}
                        onChange={(event) =>
                            setFilters((prev) => ({
                                ...prev,
                                hanCheHienThi: event.target.value,
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                    >
                        <option value="ALL">Toàn bộ</option>
                        <option value="0">Mọi độ tuổi</option>
                        <option value="1">Nội dung 18+</option>
                        <option value="2">Nội dung bạo lực / máu me</option>
                        <option value="99">Đã tạm ẩn</option>
                    </select>

                    <button
                        type="submit"
                        className="rounded-full bg-primary px-6 py-3 font-semibold text-main-text hover:bg-primary-700"
                    >
                        Tìm kiếm
                    </button>
                </form>
            </section>

            <section className="overflow-hidden rounded-[2rem] bg-bg-shade-100 shadow-sm">
                <div className="flex items-center justify-between gap-4 px-5 py-4">
                    <p className="text-sm text-main-text/60">
                        Tổng cộng: {totalElements} Post
                    </p>

                    <p className="text-sm text-main-text/60">
                        Trang {page}/{totalPages}
                    </p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-main-bg text-main-text/70">
                            <tr>
                                <th className="px-5 py-4">Ảnh</th>
                                <th className="px-5 py-4">Post ID</th>
                                <th className="px-5 py-4">Tiêu đề</th>
                                <th className="px-5 py-4">Tác giả</th>
                                <th className="px-5 py-4">Ngày đăng</th>
                                <th className="px-5 py-4">Lượt xem</th>
                                <th className="px-5 py-4">AI</th>
                                <th className="px-5 py-4">Công khai</th>
                                <th className="px-5 py-4">Trạng thái</th>
                                <th className="px-5 py-4">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {isLoading && (
                                <tr>
                                    <td className="px-5 py-6" colSpan="10">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            )}

                            {!isLoading && posts.length === 0 && (
                                <tr>
                                    <td className="px-5 py-6" colSpan="10">
                                        Không tìm thấy kết quả phù hợp.
                                    </td>
                                </tr>
                            )}

                            {!isLoading &&
                                posts.map((post) => {
                                    const firstFile = post.files?.[0];
                                    const firstFileUrl = getFileUrl(firstFile?.link);

                                    return (
                                        <tr
                                            key={post.postID}
                                            className="border-t border-main-text/10"
                                        >
                                            <td className="px-5 py-4">
                                                {firstFileUrl ? (
                                                    <video
                                                        src={firstFileUrl}
                                                        className="h-14 w-14 rounded-2xl object-cover"
                                                        autoPlay
                                                        muted
                                                        loop
                                                        playsInline
                                                        preload="metadata"
                                                        controls={false}
                                                        onContextMenu={(event) => event.preventDefault()}
                                                    />
                                                ) : (
                                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-main-bg text-xs text-main-text/50">
                                                        No img
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                {post.postID}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="max-w-[220px] truncate font-semibold">
                                                    {post.tieuDe}
                                                </p>
                                                <p className="mt-1 max-w-[220px] truncate text-xs text-main-text/60">
                                                    {post.moTa}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {post.avatarTacGia && (
                                                        <img
                                                            src={post.avatarTacGia}
                                                            alt={post.tenHienThiTacGia}
                                                            className="h-9 w-9 rounded-full object-cover"
                                                        />
                                                    )}

                                                    <div>
                                                        <p className="font-semibold">
                                                            {post.tenHienThiTacGia}
                                                        </p>
                                                        <p className="text-xs text-main-text/60">
                                                            @{post.usernameTacGia}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                {formatDateTime(post.ngayDang)}
                                            </td>

                                            <td className="px-5 py-4">
                                                {post.luotXem}
                                            </td>

                                            <td className="px-5 py-4">
                                                {post.sanPhamAI ? "Có" : "Không"}
                                            </td>

                                            <td className="px-5 py-4">
                                                {post.congKhai ? "Có" : "Không"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-main-bg px-3 py-1 text-xs">
                                                    {getVisibilityText(post.hanCheHienThi)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <Link
                                                    to={`/admin/posts/${post.postID}`}
                                                    className="rounded-full bg-main-bg px-4 py-2 hover:bg-primary"
                                                >
                                                    Chi tiết
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                <div className="px-5 pb-5">
                    <AdminPagination
                        page={page}
                        totalPages={totalPages}
                        onChange={setPage}
                    />
                </div>
            </section>
        </div>
    );
}
