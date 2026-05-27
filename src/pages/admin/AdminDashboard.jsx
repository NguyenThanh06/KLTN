import AdminStatCard from "../../components/admin/AdminStatCard.jsx";

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <p className="text-sm text-main-text/60">Xin chào Admin</p>
                <h1 className="mt-2 text-3xl font-bold">Tổng quan hệ thống</h1>
                <p className="mt-3 max-w-2xl text-sm text-main-text/70">
                    Theo dõi bài đăng, báo cáo, tài khoản người dùng và nhân sự quản trị.
                </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <AdminStatCard label="Post cần xem xét" value="12" description="Báo cáo Post chưa xử lý" />
                <AdminStatCard label="User bị báo cáo" value="7" description="Tài khoản đang chờ kiểm duyệt" />
                <AdminStatCard label="Post tạm ẩn" value="20" description="Bị hạn chế hiển thị" />
                <AdminStatCard label="Admin đang hoạt động" value="4" description="Nhân sự hiện có" />
            </section>
        </div>
    );
}