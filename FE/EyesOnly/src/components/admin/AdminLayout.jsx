import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar.jsx";
import AdminTopbar from "./AdminTopbar.jsx";

export default function AdminLayout({ setGlobalModal, addHelperError, setHelperFocusState }) {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("adminToken");

        if (!token) {
            navigate("/admin/login", { replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-main-bg text-main-text font-ui">
            <AdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="min-h-screen lg:pl-72">
                <AdminTopbar
                    onOpenSidebar={() => setSidebarOpen(true)}
                    setGlobalModal={setGlobalModal}
                />

                <main className="px-4 py-6 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-7xl">
                        <Outlet
                            context={{
                                setGlobalModal,
                                addHelperError,
                                setHelperFocusState,
                            }}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
}