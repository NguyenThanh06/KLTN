import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { adminApi } from "../../api/adminApi.js";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
const roleOptions = [
    {
        label: "Kiểm duyệt viên",
        value: 2,
    },
    {
        label: "Quản lý nhân sự",
        value: 1,
    },
    {
        label: "Đã nghỉ việc",
        value: 3,
    },
];
const roleOptionsCreate = [
    {
        label: "Kiểm duyệt viên",
        value: 2,
    },
    {
        label: "Quản lý nhân sự",
        value: 1,
    },
];
export default function AdminStaffList() {
    const { setGlobalModal } = useOutletContext();
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [message, setMessage] = useState("");
    const [staffs, setStaffs] = useState([]);
    const [editedRoles, setEditedRoles] = useState({});
    const [savingAdminID, setSavingAdminID] = useState(null);
    const [form, setForm] = useState({
        adminID: "",
        adminName: "",
        password: "",
        roleID: 2,
    });
    // Hàm đóng modal
    const closeModal = () => {
        setGlobalModal((prev) => ({
            ...prev,
            isOpen: false,
        }));
    };
    const fetchStaffs = async (targetPage = page) => {
        try {
            const response = await adminApi.getStaffs({
                page: targetPage - 1,
                size: 6,
            });

            const result = response.data?.result;

            setStaffs(result?.content || []);

            const nextEditedRoles = {};
            (result?.content || []).forEach((staff) => {
                nextEditedRoles[staff.adminID] = staff.roleID;
            });
            setEditedRoles(nextEditedRoles);

            setTotalPages(result?.totalPages || 1);
            setMessage(result?.message || "");
        } catch (error) {
            console.error("Lỗi lấy danh sách nhân sự:", error);

            setStaffs([]);
            setTotalPages(1);
            setMessage("Không tải được danh sách nhân sự.");
        }
    };

    useEffect(() => {
        fetchStaffs(page);
    }, [page]);

    const handleCreate = async (event) => {
        event.preventDefault();

        if (!form.adminID.trim()) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Thiếu thông tin",
                description: "Vui lòng không để trống AdminID.",
                primaryBtnText: "OK",
            });
            return;
        }

        if (!form.adminName.trim()) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Thiếu thông tin",
                description: "Vui lòng không để trống tên Admin.",
                primaryBtnText: "OK",
            });
            return;
        }

        if (!form.password.trim()) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Thiếu thông tin",
                description: "Vui lòng không để trống mật khẩu.",
                primaryBtnText: "OK",
            });
            return;
        }

        if (!form.roleID) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Thiếu thông tin",
                description: "Vui lòng chọn lại vai trò.",
                primaryBtnText: "OK",
            });
            return;
        }

        if (!/^[a-zA-Z0-9]+$/.test(form.adminID)) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "AdminID sai định dạng",
                description: "AdminID chỉ được chứa chữ cái hoa, thường và số.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });
            return;
        }

        if (form.password.length < 6) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Mật khẩu yếu",
                description: "Mật khẩu yếu, vui lòng nhập mật khẩu có 6 ký tự trở lên.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });
            return;
        }

        if (form.password.length > 32) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Mật khẩu quá dài",
                description: "Mật khẩu quá dài, vui lòng nhập mật khẩu có 32 ký tự trở xuống.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });
            return;
        }

        try {
            await adminApi.createStaff({
                adminID: form.adminID.trim(),
                adminName: form.adminName.trim(),
                password: form.password,
                roleID: Number(form.roleID),
            });

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Tạo thành công tài khoản Admin",
                description: "Tài khoản nhân sự mới đã được thêm vào hệ thống.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });

            setForm({
                adminID: "",
                adminName: "",
                password: "",
                roleID: 2,
            });

            setPage(1);
            fetchStaffs(1);
        } catch (error) {
            console.error("Lỗi tạo tài khoản Admin:", error);

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Không thể tạo tài khoản Admin",
                description:
                    error.response?.data?.message ||
                    "Vui lòng kiểm tra lại thông tin đã nhập.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });
        }
    };

    const handleSaveRole = async (adminID) => {
        const roleID = editedRoles[adminID];

        if (!roleID) {
            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Vai trò không hợp lệ",
                description: "Vui lòng chọn vai trò phù hợp.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });
            return;
        }

        try {
            setSavingAdminID(adminID);

            await adminApi.updateStaffRole(adminID, {
                roleID: Number(roleID),
            });

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Lưu thành công",
                description: "Vai trò của Admin đã được cập nhật.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });

            fetchStaffs(page);
        } catch (error) {
            console.error("Lỗi thay đổi vai trò:", error);

            setGlobalModal({
                isOpen: true,
                type: "one-button",
                title: "Không thể thay đổi vai trò",
                description:
                    error.response?.data?.message ||
                    "Vui lòng chọn vai trò phù hợp.",
                primaryBtnText: "OK",
                onPrimaryAction: closeModal,
            });
        } finally {
            setSavingAdminID(null);
        }
    };

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Quản lý nhân sự</h1>
                <p className="mt-2 text-sm text-main-text/60">
                    Tạo tài khoản Admin và thay đổi vai trò nhân sự.
                </p>

                <form
                    onSubmit={handleCreate}
                    className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_1fr_auto]"
                >
                    <input
                        value={form.adminID}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                adminID: event.target.value,
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="AdminID"
                    />

                    <input
                        value={form.adminName}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                adminName: event.target.value,
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="AdminName"
                    />

                    <input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                password: event.target.value,
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="Mật khẩu"
                    />

                    <select
                        value={form.roleID}
                        onChange={(event) =>
                            setForm((prev) => ({
                                ...prev,
                                roleID: Number(event.target.value),
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                    >
                        {roleOptionsCreate.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>

                    <button className="rounded-full bg-primary px-6 py-3 font-semibold hover:bg-primary-700">
                        Tạo Admin
                    </button>
                </form>
            </section>

            <section className="overflow-hidden rounded-[2rem] bg-bg-shade-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-main-bg text-main-text/70">
                            <tr>
                                <th className="px-5 py-4">Admin ID</th>
                                <th className="px-5 py-4">AdminName</th>
                                <th className="px-5 py-4">Vai trò</th>
                                <th className="px-5 py-4">Thay đổi</th>
                            </tr>
                        </thead>

                        <tbody>
                            {staffs.length === 0 && (
                                <tr>
                                    <td className="px-5 py-6" colSpan="4">
                                        {message || "Chưa có nhân sự nào trong hệ thống."}
                                    </td>
                                </tr>
                            )}

                            {staffs.map((staff) => (
                                <tr
                                    key={staff.adminID}
                                    className="border-t border-main-text/10"
                                >
                                    <td className="px-5 py-4">{staff.adminID}</td>
                                    <td className="px-5 py-4 font-semibold">
                                        {staff.adminName}
                                    </td>
                                    <td className="px-5 py-4">{staff.vaiTro}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <select
                                                value={editedRoles[staff.adminID] ?? staff.roleID}
                                                onChange={(event) =>
                                                    setEditedRoles((prev) => ({
                                                        ...prev,
                                                        [staff.adminID]: Number(event.target.value),
                                                    }))
                                                }
                                                className="rounded-full bg-main-bg px-4 py-2 outline-none ring-1 ring-main-text/10"
                                            >
                                                {roleOptions.map((role) => (
                                                    <option key={role.value} value={role.value}>
                                                        {role.label}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="button"
                                                disabled={
                                                    savingAdminID === staff.adminID ||
                                                    Number(editedRoles[staff.adminID]) === Number(staff.roleID)
                                                }
                                                onClick={() => handleSaveRole(staff.adminID)}
                                                className="rounded-full bg-primary px-4 py-2 font-semibold text-main-text hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {savingAdminID === staff.adminID ? "Đang lưu..." : "Lưu thay đổi"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
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