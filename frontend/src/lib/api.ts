import axios from "axios";
import type {
  UserMe, UserPublic, UserCard, GlobePin,
  BlogRead, BlogDetail, Summary, SearchParams,
  Education, Career,
} from "./types";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue: Array<(ok: boolean) => void> = [];

function onRefreshDone(ok: boolean) {
  refreshQueue.forEach((resolve) => resolve(ok));
  refreshQueue = [];
}

// On 401: attempt a silent token refresh, then retry the original request once.
// Skip refresh for auth-related endpoints to avoid infinite loops.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? "";
    const isAuthEndpoint = url.includes("/api/auth/");
    const onAuthPage =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/auth/");

    if (status !== 401 || isAuthEndpoint || error.config?._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until the ongoing refresh settles
      return new Promise((resolve, reject) => {
        refreshQueue.push((ok) => {
          if (ok) resolve(api({ ...error.config, _retry: true }));
          else reject(error);
        });
      });
    }

    isRefreshing = true;
    try {
      await api.post("/api/auth/refresh");
      onRefreshDone(true);
      return api({ ...error.config, _retry: true });
    } catch {
      onRefreshDone(false);
      if (!onAuthPage) window.location.href = "/auth/login";
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);

// Auth
export const authApi = {
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    api.post("/api/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),
  logout: () => api.post("/api/auth/logout"),
  googleLogin: () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
  },
  requestPasswordReset: (email: string) =>
    api.post("/api/auth/password-reset/request", { email }),
  confirmPasswordReset: (token: string, new_password: string) =>
    api.post("/api/auth/password-reset/confirm", { token, new_password }),
  requestOtp: (email: string) =>
    api.post("/api/auth/otp/request", { email }),
  verifyOtp: (email: string, otp: string) =>
    api.post("/api/auth/otp/verify", { email, otp }),
  verifyKvis: (kvis_email: string, otp: string) =>
    api.post("/api/auth/kvis/verify", { kvis_email, otp }),
};

// Users
export const userApi = {
  getMe: () => api.get<UserMe>("/api/users/me").then((r) => r.data),
  updateMe: (data: Partial<UserMe>) => api.patch<UserMe>("/api/users/me", data).then((r) => r.data),
  getUser: (id: number) => api.get<UserPublic>(`/api/users/${id}`).then((r) => r.data),
  updateEducation: (items: Omit<Education, "id">[]) =>
    api.put("/api/users/me/education", items).then((r) => r.data),
  updateCareer: (items: Omit<Career, "id">[]) =>
    api.put("/api/users/me/career", items).then((r) => r.data),
  uploadProfilePic: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ url: string }>("/api/users/me/profile-pic", form).then((r) => r.data);
  },
  getGlobePins: () => api.get<GlobePin[]>("/api/users/globe/pins").then((r) => r.data),
};

// Search
export const searchApi = {
  search: (params: SearchParams) =>
    api.get<UserCard[]>("/api/search", { params }).then((r) => r.data),
};

// Summary
export const summaryApi = {
  getSummary: () => api.get<Summary>("/api/summary").then((r) => r.data),
};

// Blogs
export const blogApi = {
  list: (params?: { tag?: string; limit?: number; offset?: number }) =>
    api.get<BlogRead[]>("/api/blogs", { params }).then((r) => r.data),
  get: (slug: string) => api.get<BlogDetail>(`/api/blogs/${slug}`).then((r) => r.data),
  create: (data: { title: string; content: string; excerpt?: string; cover_image_url?: string; tags?: string; is_published: boolean }) =>
    api.post<BlogDetail>("/api/blogs", data).then((r) => r.data),
  update: (slug: string, data: Partial<{ title: string; content: string; excerpt: string; cover_image_url: string; tags: string; is_published: boolean }>) =>
    api.patch<BlogDetail>(`/api/blogs/${slug}`, data).then((r) => r.data),
  delete: (slug: string) => api.delete(`/api/blogs/${slug}`),
};

export default api;
