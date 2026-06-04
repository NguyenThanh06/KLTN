import axiosClient from "./axiosClient";

export const postApi = {
    createPost: (formData) =>
        axiosClient.post("/posts/create", formData),
    getPostDetail: (postID) =>
        axiosClient.get(`/posts/postDetail/${postID}`),
    getRelatedPosts: (postID, { page = 0 } = {}) =>
        axiosClient.get(`/posts/postDetail/${postID}/related`, {
            params: { page },
        }),
    searchPosts: ({ keyword = "", keywordCompareType = "TAG_RELATIVE", includeAI = true, sortBy = "NEWEST", page = 0 } = {}) =>
        axiosClient.post("/posts/search", {
            keyword,
            keywordCompareType,
            includeAI,
            sortBy,
        }, {
            params: { page },
        }),
    updatePost: (postID, payload) =>
        axiosClient.put(`/posts/update/${postID}`, payload),
    deletePost: (postID) =>
        axiosClient.delete(`/posts/delete/${postID}`),
    togglePostLike: (postID) =>
        axiosClient.post(`/posts/${postID}/like`),
    togglePostSave: (postID) =>
        axiosClient.post(`/posts/${postID}/save`),
    getSavedPosts: ({ page = 0 } = {}) =>
        axiosClient.get("/posts/saved", {
            params: { page },
        }),
    verifyOriginalImage: (fileID, image) => {
        const formData = new FormData();
        formData.append("image", image);

        return axiosClient.post(`/verify/file/${fileID}`, formData);
    },
    getVerifyResult: (verifyID) =>
        axiosClient.get(`/verify/${verifyID}`),
    reportPost: (postID, payload) =>
        axiosClient.post(`/posts/${postID}/report`, payload),
    getComments: (postID, { page = 0, size = 6 } = {}) =>
        axiosClient.get(`/posts/${postID}/comments`, {
            params: { page, size },
        }),
    createComment: (postID, payload) =>
        axiosClient.post(`/posts/${postID}/comments`, payload),
    toggleCommentLike: (commentID) =>
        axiosClient.post(`/comment/${commentID}/like`),
    deleteComment: (commentID) =>
        axiosClient.delete(`/comment/delete/${commentID}`),
    getReplies: (parentID, { page = 0, size = 3 } = {}) =>
        axiosClient.get(`/posts/comments/${parentID}/replies`, {
            params: { page, size },
        }),
};
