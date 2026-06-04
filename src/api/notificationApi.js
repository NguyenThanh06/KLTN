import axiosClient from "./axiosClient";

export const notificationApi = {
    getMyNotifications: ({ page = 0, size = 10 } = {}) =>
        axiosClient.get("/notifications/me", {
            params: { page, size },
        }),
    getUnreadCount: () =>
        axiosClient.get("/notifications/unread-count"),
    markAsRead: (notificationID) =>
        axiosClient.put(`/notifications/${notificationID}/read`),
};
