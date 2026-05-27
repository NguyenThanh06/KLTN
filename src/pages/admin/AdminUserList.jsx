import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminPagination from "../../components/admin/AdminPagination.jsx";
import { adminApi } from "../../api/adminApi.js";

export default function AdminUserList() {
    const [filters, setFilters] = useState({
        accountId: "",
        lockStatus: "ALL",
    });

    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchUsers = async (targetPage = page) => {
        try {
            const response = await adminApi.searchUsers({
                accountId: filters.accountId,
                lockStatus: filters.lockStatus,
                page: targetPage - 1,
                size: 6,
            });

            const result = response.data?.result;

            setUsers(result?.content || []);
            setTotalPages(result?.totalPages || 1);
        } catch (error) {
            console.error("Lỗi tìm kiếm user admin:", error);

            setUsers([]);
            setTotalPages(1);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const handleSearch = (event) => {
        event.preventDefault();

        setPage(1);
        fetchUsers(1);
    };

    return (
        <div className="space-y-6">
            <section className="rounded-[2rem] bg-bg-shade-100 p-6 shadow-sm">
                <h1 className="text-2xl font-bold">Quản lý User</h1>
                <p className="mt-2 text-sm text-main-text/60">
                    Tìm tài khoản theo Account ID và trạng thái bị khóa.
                </p>

                <form
                    onSubmit={handleSearch}
                    className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
                >
                    <input
                        value={filters.accountId}
                        onChange={(event) =>
                            setFilters((prev) => ({
                                ...prev,
                                accountId: event.target.value,
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                        placeholder="Account ID"
                    />

                    <select
                        value={filters.lockStatus}
                        onChange={(event) =>
                            setFilters((prev) => ({
                                ...prev,
                                lockStatus: event.target.value,
                            }))
                        }
                        className="rounded-full bg-main-bg px-5 py-3 outline-none ring-1 ring-main-text/10 focus:ring-primary"
                    >
                        <option value="ALL">Toàn bộ</option>
                        <option value="LOCKED">Đã bị khóa</option>
                        <option value="UNLOCKED">Không bị khóa</option>
                    </select>

                    <button className="rounded-full bg-primary px-6 py-3 font-semibold hover:bg-primary-700">
                        Tìm kiếm
                    </button>
                </form>
            </section>

            <section className="overflow-hidden rounded-[2rem] bg-bg-shade-100 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="bg-main-bg text-main-text/70">
                            <tr>
                                <th className="px-5 py-4">Account ID</th>
                                <th className="px-5 py-4">Username</th>
                                <th className="px-5 py-4">Tên hiển thị</th>
                                <th className="px-5 py-4">Email</th>
                                <th className="px-5 py-4">Bị khóa</th>
                                <th className="px-5 py-4">Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td className="px-5 py-6" colSpan="6">
                                        Không tìm thấy kết quả phù hợp.
                                    </td>
                                </tr>
                            )}

                            {users.map((user) => (
                                <tr
                                    key={user.accountID}
                                    className="border-t border-main-text/10"
                                >
                                    <td className="px-5 py-4">{user.accountID}</td>
                                    <td className="px-5 py-4">{user.username}</td>
                                    <td className="px-5 py-4 font-semibold">
                                        {user.tenHienThi}
                                    </td>
                                    <td className="px-5 py-4">{user.email}</td>
                                    <td className="px-5 py-4">
                                        {user.biKhoa ? "Đã bị khóa" : "Không"}
                                    </td>
                                    <td className="px-5 py-4">
                                        <Link
                                            to={`/admin/users/${user.accountID}`}
                                            className="rounded-full bg-main-bg px-4 py-2 hover:bg-primary"
                                        >
                                            Xem thông tin
                                        </Link>
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