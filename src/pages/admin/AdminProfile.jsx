import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { adminApi } from "../../api/adminApi.js";

export default function AdminProfile() {
    const navigate = useNavigate();
    const { setGlobalModal } = useOutletContext();

    const [profile, setProfile] = useState(null);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const response = await adminApi.getMyProfile();
            setProfile(response.data?.result);
        };

        fetchProfile();
    }, []);

    const handleChangePassword = async (event) => {
        event.preventDefault();

        if (!passwordForm.oldPassword.trim()) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Thiếu mật khẩu cũ",
                description: "Không được để trống Mật khẩu cũ.",
                primaryBtnText: "OK",
            });
            return;
        }

        if (!passwordForm.newPassword.trim()) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Thiếu mật khẩu mới",
                description: "Không được để trống Mật khẩu mới.",
                primaryBtnText: "OK",
            });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Nhập lại mật khẩu không chính xác",
                description: "Mật khẩu mới và nhập lại mật khẩu mới không giống nhau.",
                primaryBtnText: "OK",
            });
            return;
        }

        if (
            passwordForm.newPassword.length < 6 ||
            passwordForm.newPassword.length > 32
        ) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Mật khẩu không hợp lệ",
                description: "Mật khẩu mới phải có từ 6 đến 32 ký tự.",
                primaryBtnText: "OK",
            });
            return;
        }
        try {
            await adminApi.changeMyPassword(passwordForm);
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminInfo");
        } catch (error) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Đổi mật khẩu thất bại",
                description: error.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
                primaryBtnText: "OK",
            });
            return;
        }


        navigate("/admin/login", {
            replace: true,
            state: {
                message: "Đổi mật khẩu thành công",
            },
        });
    };

    return (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Hồ sơ của tôi</h1>

                <div className="mt-6 space-y-3 text-sm">
                    <p>AdminName: {profile?.adminName || "Đang tải..."}</p>
                    <p>Vai trò: {profile?.vaiTro || "Đang tải..."}</p>
                </div>
            </section>

            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <h2 className="text-2xl font-bold">Đổi mật khẩu</h2>

                <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                    <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(event) =>
                            setPasswordForm((prev) => ({
                                ...prev,
                                oldPassword: event.target.value,
                            }))
                        }
                        className="w-full rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="Mật khẩu cũ"
                    />

                    <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                            setPasswordForm((prev) => ({
                                ...prev,
                                newPassword: event.target.value,
                            }))
                        }
                        className="w-full rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="Mật khẩu mới"
                    />

                    <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                            setPasswordForm((prev) => ({
                                ...prev,
                                confirmPassword: event.target.value,
                            }))
                        }
                        className="w-full rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="Nhập lại mật khẩu mới"
                    />

                    <button
                        type="submit"
                        className="w-full rounded-full bg-primary px-6 py-3 font-semibold hover:bg-primary-700"
                    >
                        Đổi mật khẩu
                    </button>
                </form>
            </section>
        </div>
    );
}