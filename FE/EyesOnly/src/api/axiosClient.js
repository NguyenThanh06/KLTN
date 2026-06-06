import axios from "axios";

const axiosClient = axios.create({
    baseURL: "http://localhost:8080",
});
// Tự động gắn token
axiosClient.interceptors.request.use(
    (config) => {
        const savedUser = localStorage.getItem("user");
        let savedUserToken = "";

        try {
            savedUserToken = savedUser ? JSON.parse(savedUser)?.token : "";
        } catch {
            localStorage.removeItem("user");
        }

        const token = localStorage.getItem("token") || savedUserToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        /*
         * Nếu là FormData thì để browser tự set Content-Type
         * kèm boundary multipart.
         */
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Tự động xử lý 401
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default axiosClient;
