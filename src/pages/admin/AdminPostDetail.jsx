import { useEffect, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import { adminApi } from "../../api/adminApi.js";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
const API_ORIGIN = "http://localhost:8080";
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

const getFileUrl = (link) => {
    if (!link) return "";

    if (link.startsWith("http://") || link.startsWith("https://")) {
        return link;
    }

    return `${API_ORIGIN}/uploads/posts/${link}`;
};

const getVisibilityText = (value) => {
    const numberValue = Number(value);

    if (numberValue === 0) return "Mọi độ tuổi";
    if (numberValue === 1) return "Nội dung 18+";
    if (numberValue === 2) return "Nội dung bạo lực / máu me";
    if (numberValue === 99) return "Tạm ẩn";

    return `Không xác định (${value})`;
};

export default function AdminPostDetail() {
    const [commentPage, setCommentPage] = useState(1);
    const [reportPage, setReportPage] = useState(1);
    const [hanCheHienThiGoc, setHanCheHienThiGoc] = useState(1);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [commentsData, setCommentsData] = useState({
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
    const { postID } = useParams();
    const { setGlobalModal } = useOutletContext();

    const [post, setPost] = useState(null);
    const [nextVisibility, setNextVisibility] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const fetchDetail = async (
        targetCommentPage = commentPage,
        targetReportPage = reportPage
    ) => {
        try {
            const response = await adminApi.getPostDetail(postID, {
                commentPage: targetCommentPage - 1,
                commentSize: 6,
                reportPage: targetReportPage - 1,
                reportSize: 6,
            });

            const result = response.data?.result;

            setPost(result);
            setCurrentFileIndex(0);
            setCommentsData(
                result?.comments || {
                    content: [],
                    page: 0,
                    size: 6,
                    totalElements: 0,
                    totalPages: 1,
                    first: true,
                    last: true,
                }
            );

            const nextReportsData =
                result?.baoCaos || {
                    content: [],
                    page: 0,
                    size: 6,
                    totalElements: 0,
                    totalPages: 1,
                    first: true,
                    last: true,
                };

            setReportsData(nextReportsData);

            /*
             * Lấy hạn chế hiển thị gốc từ báo cáo đầu tiên.
             * Vì BE đang sort báo cáo theo ngày báo cáo mới nhất,
             * content[0] thường là báo cáo mới nhất.
             */
            const originalVisibility = nextReportsData.content?.[0]?.hanCheHienThiGoc;

            setHanCheHienThiGoc(
                originalVisibility === null || originalVisibility === undefined
                    ? result?.hanCheHienThi
                    : originalVisibility
            );

            setNextVisibility("");

        } catch (error) {
            console.error("Lỗi lấy chi tiết Post admin:", error);

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Không tải được chi tiết Post",
                description: "Post có thể không tồn tại hoặc bạn chưa có quyền truy cập.",
                primaryBtnText: "OK",
            });
        }
    };

    useEffect(() => {
        fetchDetail(commentPage, reportPage);
    }, [postID, commentPage, reportPage]);

    const handleSaveVisibility = async () => {
        if (nextVisibility === "") {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Chưa chọn thay đổi",
                description: "Bạn hãy chọn chế độ hiển thị muốn cập nhật.",
                primaryBtnText: "OK",
            });
            return;
        }

        try {
            await adminApi.updatePostVisibility(postID, {
                hanCheHienThi: Number(nextVisibility),
                daXemXetBaoCao: true,
            });

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Lưu thay đổi thành công",
                description: "Trạng thái hiển thị của Post đã được cập nhật.",
                primaryBtnText: "OK",
            });

            fetchDetail();
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái Post:", error);

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Không thể thực hiện hành động",
                description: "Post có thể đã bị xóa hoặc dữ liệu không còn hợp lệ.",
                primaryBtnText: "OK",
            });
        }
    };
    const handlePrevFile = () => {
        const files = post?.files || [];

        if (files.length <= 1) return;

        setCurrentFileIndex((prev) =>
            prev === 0 ? files.length - 1 : prev - 1
        );
    };

    const handleNextFile = () => {
        const files = post?.files || [];

        if (files.length <= 1) return;

        setCurrentFileIndex((prev) =>
            prev === files.length - 1 ? 0 : prev + 1
        );
    };

    const keepVideoPlaying = (event) => {
        const video = event.currentTarget;

        if (video.paused) {
            video.play().catch(() => { });
        }
    };

    const preventVideoSeeking = (event) => {
        const video = event.currentTarget;

        /*
         * Nếu không có controls thì người dùng thường không tua được.
         * Đoạn này chỉ để phòng trường hợp browser/device có hành vi lạ.
         */
        if (video.currentTime > 0.3) {
            video.currentTime = 0;
        }

        video.play().catch(() => { });
    };
    if (isLoading && !post) {
        return (
            <div className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                Đang tải chi tiết Post...
            </div>
        );
    }

    if (!post) {
        return (
            <div className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                Không tìm thấy dữ liệu Post.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="text-sm text-main-text/60">
                            Post #{post.postID}
                        </p>

                        <h1 className="mt-2 text-3xl font-bold">
                            {post.tieuDe}
                        </h1>

                        <p className="mt-3 max-w-3xl text-sm text-main-text/70">
                            {post.moTa || "Bài viết chưa có mô tả."}
                        </p>
                    </div>

                    <span className="rounded-full bg-main-bg px-4 py-2 text-sm">
                        {getVisibilityText(post.hanCheHienThi)}
                    </span>
                </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
                <div className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-xl font-bold">Danh sách video</h2>

                        {(post.files || []).length > 0 && (
                            <p className="rounded-full bg-main-bg px-4 py-2 text-sm text-main-text/60">
                                {currentFileIndex + 1}/{post.files.length}
                            </p>
                        )}
                    </div>

                    <div className="mt-5">
                        {(post.files || []).length === 0 && (
                            <div className="rounded-3xl bg-main-bg p-6 text-sm text-main-text/60">
                                Post này chưa có file video.
                            </div>
                        )}

                        {(post.files || []).length > 0 && (
                            <div className="space-y-4">
                                <div className="relative overflow-hidden rounded-[2rem] bg-main-bg">
                                    <video
                                        key={post.files[currentFileIndex]?.fileID}
                                        src={getFileUrl(post.files[currentFileIndex]?.link)}
                                        className="h-[30rem] w-full object-contain"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                        controls={false}
                                        preload="auto"
                                        disablePictureInPicture
                                        controlsList="nodownload nofullscreen noremoteplayback"
                                        onPause={keepVideoPlaying}
                                        onSeeking={preventVideoSeeking}
                                        onContextMenu={(event) => event.preventDefault()}
                                        onLoadedData={(event) => {
                                            event.currentTarget.play().catch(() => { });
                                        }}
                                    />

                                    <div className="absolute bottom-4 left-4 rounded-full bg-main-bg/90 px-4 py-2 text-xs text-main-text">
                                        File #{post.files[currentFileIndex]?.fileID} •{" "}
                                        {post.files[currentFileIndex]?.width}x
                                        {post.files[currentFileIndex]?.height}
                                    </div>

                                    <div className="pointer-events-none absolute inset-0 flex rotate-[-20deg] items-center justify-center text-2xl font-bold text-main-text/10">
                                        EyesOnly • Protected
                                    </div>

                                    {(post.files || []).length > 1 && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handlePrevFile}
                                                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-main-bg/90 text-xl font-bold shadow-sm hover:bg-bg-shade-100"
                                            >
                                                ‹
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleNextFile}
                                                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-main-bg/90 text-xl font-bold shadow-sm hover:bg-bg-shade-100"
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}
                                </div>

                                {(post.files || []).length > 1 && (
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {post.files.map((file, index) => (
                                            <button
                                                key={file.fileID}
                                                type="button"
                                                onClick={() => setCurrentFileIndex(index)}
                                                className={`h-3 w-3 rounded-full ${index === currentFileIndex
                                                        ? "bg-primary"
                                                        : "bg-main-bg ring-1 ring-main-text/10"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                        <h2 className="text-xl font-bold">Thông tin Post</h2>

                        <div className="mt-5 space-y-3 text-sm">
                            <p>Tác giả: {post.tenTacGia || "Không rõ"}</p>
                            <p>Username: @{post.usernameTacGia || "unknown"}</p>
                            <p>Account ID: {post.tacGiaID}</p>
                            <p>Ngày đăng: {formatDateTime(post.ngayDang)}</p>
                            <p>Lượt xem: {post.luotXem}</p>
                            <p>Lượt thích: {post.luotThich}</p>
                            <p>Sản phẩm AI: {post.sanPhamAI ? "Có" : "Không"}</p>
                            <p>Công khai: {post.congKhai ? "Có" : "Không"}</p>
                            <p>
                                Đã xem xét báo cáo:{" "}
                                {post.daXemXetBaoCao ? "Rồi" : "Chưa"}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                        <h2 className="text-xl font-bold">
                            Thay đổi chế độ hiển thị
                        </h2>

                        <select
                            value={nextVisibility}
                            onChange={(event) =>
                                setNextVisibility(event.target.value)
                            }
                            className="mt-5 w-full rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        >
                            <option value="">Không thay đổi</option>
                            <option
                                value={String(hanCheHienThiGoc)}
                                disabled={post.hanCheHienThi !== 99}
                            >
                                Mở tạm ẩn về {getVisibilityText(Number(hanCheHienThiGoc))}
                            </option>
                            <option value="99">Tạm ẩn</option>
                        </select>

                        <button
                            type="button"
                            onClick={handleSaveVisibility}
                            className="mt-5 w-full rounded-full bg-primary px-6 py-3 font-semibold hover:bg-primary-700"
                        >
                            Lưu thay đổi
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold">Danh sách thẻ</h2>

                <div className="mt-4 flex flex-wrap gap-2">
                    {(post.tags || []).length === 0 && (
                        <p className="text-sm text-main-text/60">
                            Chưa có thẻ nào.
                        </p>
                    )}

                    {(post.tags || []).map((tag) => (
                        <span
                            key={tag}
                            className="rounded-full bg-main-bg px-4 py-2 text-sm"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            </section>

            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Danh sách Comment</h2>
                        <p className="mt-1 text-sm text-main-text/60">
                            Tổng cộng: {commentsData.totalElements} comment
                        </p>
                    </div>

                    <p className="text-sm text-main-text/60">
                        Trang {commentPage}/{commentsData.totalPages || 1}
                    </p>
                </div>

                <div className="mt-5 space-y-3">
                    {(commentsData.content || []).length === 0 && (
                        <p className="text-sm text-main-text/60">
                            Chưa có comment nào.
                        </p>
                    )}

                    {(commentsData.content || []).map((comment) => (
                        <div
                            key={comment.commentID}
                            className="rounded-3xl bg-main-bg p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold">
                                        {comment.tenHienThiNguoiViet}
                                    </p>

                                    <p className="text-xs text-main-text/60">
                                        @{comment.usernameNguoiViet} • Comment #{comment.commentID}
                                    </p>
                                </div>

                                <p className="text-xs text-main-text/60">
                                    {comment.thoiGianDang}
                                </p>
                            </div>

                            <p className="mt-3 text-sm">
                                {comment.noiDung}
                            </p>

                            {comment.parentCommentID && (
                                <p className="mt-2 text-xs text-main-text/60">
                                    Trả lời comment #{comment.parentCommentID}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                <AdminPagination
                    page={commentPage}
                    totalPages={commentsData.totalPages || 1}
                    onChange={setCommentPage}
                />
            </section>

            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold">Báo cáo nhận được</h2>
                        <p className="mt-1 text-sm text-main-text/60">
                            Tổng cộng: {reportsData.totalElements} báo cáo
                        </p>
                    </div>

                    <p className="text-sm text-main-text/60">
                        Trang {reportPage}/{reportsData.totalPages || 1}
                    </p>
                </div>

                <div className="mt-5 space-y-3">
                    {(reportsData.content || []).length === 0 && (
                        <p className="text-sm text-main-text/60">
                            Post này chưa nhận báo cáo nào.
                        </p>
                    )}

                    {(reportsData.content || []).map((report) => (
                        <div
                            key={report.baoCaoID}
                            className="rounded-3xl bg-main-bg p-5"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="font-semibold">
                                        Báo cáo #{report.baoCaoID}
                                    </p>

                                    <p className="mt-1 text-sm text-main-text/70">
                                        Người báo cáo:{" "}
                                        {report.tenHienThiNguoiBaoCao ||
                                            report.usernameNguoiBaoCao ||
                                            report.nguoiBaoCaoID ||
                                            "Chưa có dữ liệu"}
                                    </p>
                                </div>

                                <p className="text-xs text-main-text/60">
                                    {report.ngayBaoCao}
                                </p>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                                <p>Mục báo cáo: {report.mucBaoCao}</p>
                                <p>Nội dung: {report.noiDungBaoCao}</p>
                                <p>
                                    Hạn chế hiển thị gốc: {report.hanCheHienThiText}
                                </p>
                            </div>
                        </div>
                    ))}
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