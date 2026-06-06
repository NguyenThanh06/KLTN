import { useEffect, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function AdminUserDetail() {
    const { accountID } = useParams();
    const { setGlobalModal } = useOutletContext();

    const [user, setUser] = useState(null);
    const [postPage, setPostPage] = useState(1);
    const [reportPage, setReportPage] = useState(1);

    const [postsData, setPostsData] = useState({
        content: [],
        page: 0,
        size: 6,
        totalElements: 0,
        totalPages: 1,
        first: true,
        last: true,
    });

    const [reportsData, setReportsData] = useState({
        content: [],
        page: 0,
        size: 6,
        totalElements: 0,
        totalPages: 1,
        first: true,
        last: true,
    });
    const fetchUser = async (
        targetPostPage = postPage,
        targetReportPage = reportPage
    ) => {
        try {
            const response = await adminApi.getUserDetail(accountID, {
                postPage: targetPostPage - 1,
                postSize: 6,
                reportPage: targetReportPage - 1,
                reportSize: 6,
            });

            const result = response.data?.result;

            setUser(result);

            setPostsData(
                result?.thuVienTacPham || {
                    content: [],
                    page: 0,
                    size: 6,
                    totalElements: 0,
                    totalPages: 1,
                    first: true,
                    last: true,
                }
            );

            setReportsData(
                result?.baoCaos || {
                    content: [],
                    page: 0,
                    size: 6,
                    totalElements: 0,
                    totalPages: 1,
                    first: true,
                    last: true,
                }
            );
        } catch (error) {
            console.error("Lỗi lấy thông tin User admin:", error);

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Không tải được thông tin User",
                description: "Account có thể không tồn tại hoặc bạn chưa có quyền truy cập.",
                primaryBtnText: "OK",
            });
        }
    };

    useEffect(() => {
        fetchUser(postPage, reportPage);
    }, [accountID, postPage, reportPage]);

    const handleUnlock = () => {
        const closeModal = () => {
            setGlobalModal((prev) => ({
                ...prev,
                isOpen: false,
            }));
        };

        setGlobalModal({
            isOpen: true,
            type: "two-buttons",
            title: "Mở khóa tài khoản",
            description: "Bạn có chắc chắn muốn mở khóa tài khoản này không?",
            primaryBtnText: "Có, mở khóa",
            secondaryBtnText: "Không",

            onSecondaryAction: closeModal,

            onPrimaryAction: async () => {
                try {
                    console.log("Đang gọi API mở khóa accountID:", accountID);

                    const response = await adminApi.unlockUser(accountID);

                    console.log("Kết quả mở khóa:", response.data);

                    setUser((prev) => ({
                        ...prev,
                        biKhoa: false,
                    }));

                    setGlobalModal({
                        isOpen: true,
                        type: "one-button",
                        title: "Mở khóa thành công",
                        description: "Tài khoản người dùng đã được mở khóa.",
                        primaryBtnText: "OK",
                        onPrimaryAction: closeModal,
                    });

                    await fetchUser(postPage, reportPage);
                } catch (error) {
                    console.error("Lỗi mở khóa tài khoản:", error);

                    setGlobalModal({
                        isOpen: true,
                        type: "one-button",
                        title: "Không thể mở khóa tài khoản",
                        description:
                            error.response?.data?.message ||
                            "Tài khoản có thể không tồn tại hoặc bạn chưa có quyền thực hiện.",
                        primaryBtnText: "OK",
                        onPrimaryAction: closeModal,
                    });
                }
            },
        });
    };

    if (!user) {
        return <p>Đang tải thông tin User...</p>;
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <img
                        src={user.avatar}
                        alt={user.tenHienThi}
                        className="h-24 w-24 rounded-full object-cover"
                    />

                    <div>
                        <p className="text-sm text-main-text/60">
                            Account #{user.accountID}
                        </p>
                        <h1 className="mt-1 text-3xl font-bold">
                            {user.tenHienThi}
                        </h1>
                        <p className="mt-2 text-sm text-main-text/70">
                            @{user.username}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                    <h2 className="text-xl font-bold">Thông tin tài khoản</h2>

                    <div className="mt-5 space-y-3 text-sm">
                        <p>Email: {user.email}</p>
                        <p>Tiểu sử: {user.tieuSu || "Chưa có"}</p>
                        <p>Số người theo dõi: {user.soNguoiTheoDoi}</p>
                        <p>Đang theo dõi: {user.soNguoiDangTheoDoi}</p>
                        <p>Ngày tham gia: {user.ngayThamGia}</p>
                        <p>Đã xác thực: {user.daXacThuc ? "Rồi" : "Chưa"}</p>
                        <p>Vô hiệu hóa: {user.daVoHieuHoa ? "Có" : "Không"}</p>
                        {user.daVoHieuHoa && (
                            <p>Ngày vô hiệu hóa: {user.ngayVoHieuHoa || "Chưa có"}</p>
                        )}
                        <p>Bị khóa: {user.biKhoa ? "Có" : "Không"}</p>
                    </div>

                    {user.biKhoa && (
                        <button
                            type="button"
                            onClick={handleUnlock}
                            className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-semibold hover:bg-primary-700"
                        >
                            Mở khóa tài khoản
                        </button>
                    )}
                </div>
                <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-bold">Thư viện tác phẩm</h2>
                            <p className="mt-1 text-sm text-main-text/60">
                                Tổng cộng: {postsData.totalElements} post
                            </p>
                        </div>

                        <p className="text-sm text-main-text/60">
                            Trang {postPage}/{postsData.totalPages || 1}
                        </p>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {(postsData.content || []).length === 0 && (
                            <p className="text-sm text-main-text/60">
                                Account này chưa có tác phẩm nào.
                            </p>
                        )}

                        {(postsData.content || []).map((post) => (
                            <Link
                                key={post.postID}
                                to={`/admin/posts/${post.postID}`}
                                className="rounded-3xl bg-main-bg p-5 hover:bg-bg-shade-100"
                            >
                                <p className="font-semibold">
                                    {post.tieuDe || "Không có tiêu đề"}
                                </p>

                                <p className="mt-2 text-sm text-main-text/60">
                                    Post #{post.postID}
                                </p>

                                <p className="mt-2 text-sm text-main-text/60">
                                    Công khai: {post.congKhai ? "Có" : "Không"}
                                </p>

                                <p className="mt-2 text-sm text-main-text/60">
                                    Hạn chế hiển thị: {post.hanCheHienThiText}
                                </p>
                            </Link>
                        ))}
                    </div>

                    <AdminPagination
                        page={postPage}
                        totalPages={postsData.totalPages || 1}
                        onChange={setPostPage}
                    />
                </section>

                <div className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                    <h2 className="text-xl font-bold">Báo cáo đã nhận</h2>

                    <div className="mt-5 space-y-3">
                        {(reportsData.content || []).map((report) => (
                            <div
                                key={report.baoCaoUID}
                                className="rounded-3xl bg-main-bg p-5"
                            >
                                <p className="font-semibold">
                                    Báo cáo #{report.baoCaoUID}
                                </p>
                                <p className="mt-2 text-sm text-main-text/70">
                                    Người báo cáo: {report.nguoiBaoCaoID}
                                </p>
                                <p className="mt-1 text-sm">
                                    Mục báo cáo: {report.mucBaoCao}
                                </p>
                                <p className="mt-1 text-sm">
                                    Nội dung: {report.noiDungBaoCao}
                                </p>
                                <p className="mt-1 text-sm text-main-text/60">
                                    Ngày báo cáo: {report.ngayBaoCao}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <AdminPagination
                    page={reportPage}
                    totalPages={reportsData.totalPages || 1}
                    onChange={setReportPage}
                />
            </section>
        </div>
    );
}