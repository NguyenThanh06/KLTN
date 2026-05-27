import { useNavigate } from "react-router-dom";

export default function AdminTopbar({ onOpenSidebar, setGlobalModal }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        setGlobalModal({
            isOpen: true,
            type: "two-buttons",
            title: "Đăng xuất Admin",
            description: "Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị không?",
            primaryBtnText: "Đăng xuất",
            secondaryBtnText: "Ở lại",
            onPrimaryAction: () => {
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminInfo");
                navigate("/admin/login", { replace: true });
            },
        });
    };

    return (
        <header className="sticky top-0 z-30 border-b border-main-text/10 bg-main-bg/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={onOpenSidebar}
                    className="rounded-full bg-bg-shade-100 px-4 py-2 text-sm lg:hidden"
                >
                    Menu
                </button>

                <div>
                    <p className="text-xs text-main-text/60">Trang quản trị</p>
                    <h2 className="text-lg font-semibold">Bảng điều khiển Admin</h2>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-main-text transition hover:bg-primary-700"
                >
                    Đăng xuất
                </button>
            </div>
        </header>
    );
}