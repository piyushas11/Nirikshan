import axios from "axios";
import { supabase } from "./supabaseClient";

const axiosInstance = axios.create({

  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",

  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000", // ✅ comma added

  timeout: 30_000,
});

// ── Request interceptor — attach Supabase JWT ──────────────────────────────
axiosInstance.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor — handle 401 globally ────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;