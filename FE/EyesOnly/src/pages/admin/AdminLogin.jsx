import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api/adminApi.js";

export default function AdminLogin({ setGlobalModal, addHelperError }) {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        adminID: "",
        password: "",
    });

    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.adminID.trim()) {
            addHelperError({
                id: Date.now(),
                code: "Vui lòng không để trống AdminName",
            });
            return;
        }

        if (!form.password.trim()) {
            addHelperError({
                id: Date.now(),
                code: "Không được để trống mật khẩu",
            });
            return;
        }

        try {
            setIsLoading(true);

            const response = await adminApi.login({
                adminID: form.adminID,
                password: form.password,
            });

            const data = response.data;

            localStorage.setItem("adminToken", data.result.token);
            localStorage.setItem("adminRole", data.result.vaiTro);
            
            // localStorage.setItem("adminInfo", JSON.stringify(data.admin));

            navigate("/admin", { replace: true });
        } catch (error) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Đăng nhập thất bại",
                description: "Tên đăng nhập hoặc mật khẩu không chính xác.",
                primaryBtnText: "Đã hiểu",
            });
        } finally {
            setIsLoading(false);
        }
    };
    // Mock login tạm thời để tiện phát triển giao diện admin, sẽ thay bằng API thật sau
    // const handleSubmit = async (event) => {
    //     event.preventDefault();

    //     if (!form.adminName.trim()) {
    //         addHelperError({
    //             id: Date.now(),
    //             code: "Vui lòng không để trống AdminName",
    //         });
    //         return;
    //     }

    //     if (!form.password.trim()) {
    //         addHelperError({
    //             id: Date.now(),
    //             code: "Không được để trống mật khẩu",
    //         });
    //         return;
    //     }

    //     localStorage.setItem("adminToken", "mock-admin-token");
    //     localStorage.setItem(
    //         "adminInfo",
    //         JSON.stringify({
    //             adminID: "admin01",
    //             adminName: form.adminName,
    //             vaiTro: "Kiểm duyệt viên",
    //         })
    //     );

    //     navigate("/admin", { replace: true });
    // };
    return (
        <div className="flex min-h-screen items-center justify-center bg-main-bg px-4 font-ui text-main-text">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-[2rem] bg-bg-shade-100 p-8 shadow-sm"
            >
                <div className="mb-8 text-center">
                    <p className="text-sm text-main-text/60">EyesOnly</p>
                    <h1 className="mt-2 text-3xl font-bold">Đăng nhập Admin</h1>
                    <p className="mt-3 text-sm text-main-text/60">
                        Dành cho kiểm duyệt viên và quản lý nhân sự.
                    </p>
                </div>

                <div className="space-y-5">
                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold">
                            adminID
                        </span>
                        <input
                            name="adminID"
                            value={form.adminID}
                            onChange={handleChange}
                            className="w-full rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                            placeholder="Nhập AdminID"
                        />
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-sm font-semibold">
                            Mật khẩu
                        </span>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                            placeholder="Nhập mật khẩu"
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-8 w-full rounded-full bg-primary px-6 py-3 font-semibold text-main-text transition hover:bg-primary-700 disabled:opacity-60"
                >
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
            </form>
        </div>
    );
}