import { NavLink } from "react-router-dom";

const navItems = [
    {
        to: "/admin",
        label: "Tổng quan",
        roles: ["ADMIN"],
    },
    {
        to: "/admin/posts",
        label: "Kiểm duyệt Post",
        roles: ["MODERATOR"],
    },
    {
        to: "/admin/users",
        label: "Quản lý User",
        roles: ["MODERATOR"],
    },
    {
        to: "/admin/staff",
        label: "Quản lý nhân sự",
        roles: ["HR"],
    },
    {
        to: "/admin/profile",
        label: "Hồ sơ của tôi",
        roles: ["ADMIN"],
    },
];

const getAdminRoleKey = (roleName) => {
    if (!roleName) return "ADMIN";

    if (
        roleName === "QuanLyNhanSu" ||
        roleName === "Quản lý nhân sự" ||
        roleName === "HR"
    ) {
        return "HR";
    }

    if (
        roleName === "KiemDuyetVien" ||
        roleName === "Kiểm duyệt viên" ||
        roleName === "KiemDuyetNoiDung" ||
        roleName === "Kiểm duyệt nội dung"
    ) {
        return "MODERATOR";
    }

    return "ADMIN";
};

export default function AdminSidebar({ isOpen, onClose }) {
    /*
     * Vai trò admin nên được lưu sau khi login.
     * Ví dụ:
     * localStorage.setItem("adminRole", result.vaiTro);
     */
    const adminRole = localStorage.getItem("adminRole");

    const roleKey = getAdminRoleKey(adminRole);

    const visibleNavItems = navItems.filter((item) => {
        /*
         * ADMIN là menu chung cho mọi admin.
         * Ví dụ: Tổng quan, Hồ sơ của tôi.
         */
        if (item.roles.includes("ADMIN")) {
            return true;
        }

        /*
         * Menu riêng theo vai trò.
         */
        return item.roles.includes(roleKey);
    });

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-main-text/30 transition lg:hidden ${
                    isOpen ? "block" : "hidden"
                }`}
                onClick={onClose}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-bg-shade-100 px-5 py-6 shadow-xl transition lg:translate-x-0 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="mb-8 rounded-3xl bg-main-bg px-5 py-4 shadow-sm">
                    <p className="text-sm text-main-text/60">EyesOnly</p>
                    <h1 className="text-xl font-bold text-main-text">
                        Admin Center
                    </h1>

                    {adminRole && (
                        <p className="mt-2 text-xs text-main-text/50">
                            Vai trò: {adminRole}
                        </p>
                    )}
                </div>

                <nav className="space-y-2">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === "/admin"}
                            onClick={onClose}
                            className={({ isActive }) =>
                                [
                                    "block rounded-full px-5 py-3 text-sm transition",
                                    isActive
                                        ? "bg-primary text-main-text shadow-sm"
                                        : "text-main-text hover:bg-main-bg",
                                ].join(" ")
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
}