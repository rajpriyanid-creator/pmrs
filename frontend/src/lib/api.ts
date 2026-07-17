import axios, { AxiosError } from "axios";
import { useAuthStore } from "../store/authStore";

/**
 * Central API client. Access tokens are held in memory only (zustand store,
 * not localStorage) to reduce XSS-exfiltration surface; the refresh token is
 * likewise memory-held here since this SPA has no same-site backend session
 * to place it in an httpOnly cookie for (Section 10 - client hardening
 * within an SPA's constraints).
 */
export const api = axios.create({ baseURL: "/api" });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing ??= refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      useAuthStore.getState().clear();
    }
    return Promise.reject(error);
  },
);

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return null;
    const { data } = await axios.post("/api/auth/refresh", { refreshToken });
    const accessToken = data.data.accessToken as string;
    useAuthStore.getState().setAccessToken(accessToken);
    return accessToken;
  } catch {
    return null;
  }
}

export function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  return promise.then((res) => res.data.data);
}
