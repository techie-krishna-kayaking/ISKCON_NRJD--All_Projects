import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5009";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("pms_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const msg = error.response?.data?.message?.toLowerCase() || "";

    if (status === 401) {
      const isTokenBad =
        msg.includes("expired") ||
        msg.includes("invalid token") ||
        msg.includes("user not found. token invalid");

      if (isTokenBad) {
        localStorage.removeItem("pms_token");
        localStorage.removeItem("pms_user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
