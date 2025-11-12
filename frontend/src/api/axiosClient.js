import axios from "axios";

/**
 * ✅ Base URL Configuration
 * Uses Vite environment variable when available,
 * otherwise defaults to your local Laravel API.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * 🔐 Request Interceptor — Automatically attach JWT
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("tuna_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 🚨 Response Interceptor — Global 401 & Error Handling
 */
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // If token expired or invalid
      if (status === 401) {
        console.warn("⚠️ Unauthorized – token expired or invalid");
        localStorage.removeItem("tuna_token");
        localStorage.removeItem("tuna_user");
        window.location.href = "/login";
      }

      // Optional: log other API errors for debugging
      if (status >= 500) {
        console.error("🚨 Server error:", error.response.data);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
