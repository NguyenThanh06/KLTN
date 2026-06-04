import axiosClient from "./axiosClient";

export const profileApi = {
    getMyProfile: ({ page = 0, size = 6 } = {}) =>
        axiosClient.get("/profile/me", {
            params: { page, size },
        }),
    getMyProfileInfo: ({ page = 0, size = 6 } = {}) =>
        axiosClient.get("/profile/info", {
            params: { page, size },
        }),
    updateMyProfile: (formData) =>
        axiosClient.put("/profile/me", formData),
    getPublicProfile: (accountID, { page = 0, size = 6 } = {}) =>
        axiosClient.get(`/profile/${accountID}`, {
            params: { page, size },
        }),
    getFollowers: (accountID, { keyword = "", page = 0, size = 6 } = {}) =>
        axiosClient.get(`/account/${accountID}/followers`, {
            params: { keyword, page, size },
        }),
    getFollowing: (accountID, { keyword = "", page = 0, size = 6 } = {}) =>
        axiosClient.get(`/account/${accountID}/following`, {
            params: { keyword, page, size },
        }),
    searchAccounts: ({ keyword = "", page = 0, size = 6 } = {}) =>
        axiosClient.get("/account/search", {
            params: { keyword, page, size },
        }),
    getBlockedAccounts: ({ keyword = "", page = 0, size = 6 } = {}) =>
        axiosClient.get("/account/blocked", {
            params: { keyword, page, size },
        }),
    followAccount: (targetAccountID) =>
        axiosClient.post(`/account/${targetAccountID}/follow`),
    unfollowAccount: (targetAccountID) =>
        axiosClient.delete(`/account/${targetAccountID}/follow`),
    blockAccount: (targetAccountID) =>
        axiosClient.post(`/account/${targetAccountID}/block`),
    unblockAccount: (targetAccountID) =>
        axiosClient.delete(`/account/${targetAccountID}/block`),
    reportAccount: (targetAccountID, payload) =>
        axiosClient.post(`/account/${targetAccountID}/report`, payload),
    disableMyAccount: () =>
        axiosClient.put("/account-setting/disable"),
    enableMyAccount: () =>
        axiosClient.put("/account-setting/enable"),
    requestChangePassword: ({ currentPassword, newPassword, confirmPassword }) =>
        axiosClient.post("/account-setting/change-password", {
            oldPassword: currentPassword,
            newPassword,
            confirmNewPassword: confirmPassword,
        }),
    confirmChangePassword: ({ otp }) =>
        axiosClient.post("/account-setting/change-password/confirm", { otp }),
};
