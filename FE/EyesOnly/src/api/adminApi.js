import axios from "axios";

const ADMIN_API = "http://localhost:8080/admin";

const getAdminToken = () => localStorage.getItem("adminToken");

const adminClient = axios.create({
    baseURL: ADMIN_API,
});

adminClient.interceptors.request.use((config) => {
    const token = getAdminToken();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const adminApi = {
    login: (payload) => adminClient.post("/auth/login", payload),

    getDashboard: () => adminClient.get("/dashboard"),

    searchPosts: ({ postId, hanCheHienThi = "ALL", page = 0, size = 6 }) =>
    adminClient.post(
        "/posts/search",
        {
            postId: postId ? Number(postId) : null,
            hanCheHienThi,
        },
        {
            params: {
                page,
                size,
            },
        }
    ),
    getPostDetail: (
        postID,
        {
            commentPage = 0,
            commentSize = 6,
            reportPage = 0,
            reportSize = 6,
        } = {}
    ) =>
        adminClient.get(`/posts/${postID}`, {
            params: {
                commentPage,
                commentSize,
                reportPage,
                reportSize,
            },
        }),
    updatePostVisibility(postID, data) {
    return adminClient.put(`/posts/${postID}/change_status`, data);
    },
    getPostReportDetail: (baoCaoPID) =>
        adminClient.get(`/post-reports/${baoCaoPID}`),

    searchUsers: ({ accountId, lockStatus = "ALL", page = 0, size = 6 }) =>
    adminClient.post(
        "/users/search",
        {
            accountId: accountId ? Number(accountId) : null,
            lockStatus,
        },
        {
            params: {
                page,
                size,
            },
        }
    ),
    getUserDetail: (
        accountID,
        {
            postPage = 0,
            postSize = 6,
            reportPage = 0,
            reportSize = 6,
        } = {}
    ) =>
        adminClient.get(`/users/${accountID}`, {
            params: {
                postPage,
                postSize,
                reportPage,
                reportSize,
            },
        }),
    unlockUser: (accountID) => adminClient.patch(`/users/${accountID}/unlock`),
    getUserReportDetail: (baoCaoUID) =>
        adminClient.get(`/user-reports/${baoCaoUID}`),

    getStaffs: (params) => adminClient.get("/staff", { params }),
    createStaff: (payload) => adminClient.post("/staff", payload),
    updateStaffRole: (adminID, payload) =>
        adminClient.patch(`/staff/${adminID}/role`, payload),

    getMyProfile: () => adminClient.get("/account/profile"),
    changeMyPassword: (payload) => adminClient.patch("/account/password", payload),
};