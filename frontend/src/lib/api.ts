import axios from "axios";
import type { BlogComment } from "./types";
import type {
  UserMe, UserPublic, UserCard, GlobePin,
  BlogRead, BlogDetail, Summary, SearchParams,
  Education, Career,
} from "./types";
import { filterGlobePins } from "./utils";

const api = axios.create({
  // Relative base: requests hit the frontend's own origin and are proxied to the
  // backend via next.config rewrites. Keeps auth cookies first-party.
  baseURL: "",
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
    const isMeProbe = url.includes("/api/users/me");
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
      if (!onAuthPage && !isMeProbe) window.location.href = "/auth/login";
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
    window.location.href = `/api/auth/google`;
  },
  linkGoogle: () => { window.location.href = `/api/auth/link-google`; },
  unlinkGoogle: () => api.post("/api/auth/unlink-google"),
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
  verifyEmail: (email: string, otp: string) =>
    api.post("/api/auth/email/verify", { email, otp }),
  resendVerification: (email: string) =>
    api.post("/api/auth/otp/request", { email }),
  setPassword: (data: { new_password: string }) =>
    api.post("/api/auth/set-password", data),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post("/api/auth/change-password", data),
};

// Users
export const userApi = {
  getMe: () => api.get<UserMe>("/api/users/me").then((r) => r.data),
  updateMe: (data: Partial<UserMe>) => api.patch<UserMe>("/api/users/me", data).then((r) => r.data),
  getUser: (slug: string) => api.get<UserPublic>(`/api/users/${slug}`).then((r) => r.data),
  updateEducation: (items: Omit<Education, "id">[]) =>
    api.put("/api/users/me/education", items).then((r) => r.data),
  updateCareer: (items: Omit<Career, "id">[]) =>
    api.put("/api/users/me/career", items).then((r) => r.data),
  updateProjects: (items: { title: string; advisor?: string; advisor2?: string; description?: string; status: string; link?: string }[]) =>
    api.put("/api/users/me/projects", items).then((r) => r.data),
  updatePublications: (items: { citation: string; doi?: string }[]) =>
    api.put("/api/users/me/publications", items).then((r) => r.data),
  updatePortfolioLinks: (items: { type: string; url: string }[]) =>
    api.put("/api/users/me/portfolio-links", items).then((r) => r.data),
  updateExtraContacts: (items: { type: string; value: string; is_public: boolean }[]) =>
    api.put("/api/users/me/extra-contacts", items).then((r) => r.data),
  updateLanguages: (items: { lang: string; proficiency?: string }[]) =>
    api.put("/api/users/me/languages", items).then((r) => r.data),
  updateResearchInterests: (interests: string[]) =>
    api.put("/api/users/me/research-interests", { interests }).then((r) => r.data),
  uploadProfilePic: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ url: string }>("/api/users/me/profile-pic", form).then((r) => r.data);
  },
  getGlobePins: () =>
    api.get<GlobePin[]>("/api/users/globe/pins").then((r) => filterGlobePins(r.data)),
  deleteAccount: () => api.delete("/api/users/me"),
};

// Search
export const searchApi = {
  // The globe overlay needs every matching alumnus (no pagination UI), but the
  // backend /search defaults to limit=50 and truncates. Request the full set so
  // counts and pins reflect all matches. Backend caps at le=2000 (>864 total).
  search: (params: SearchParams) =>
    api.get<UserCard[]>("/api/search", { params: { ...params, limit: 2000 } }).then((r) => r.data),
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
    api.patch<BlogDetail>(`/api/blogs/${slug}`, data).then(r => r.data),
  delete: (slug: string) => api.delete(`/api/blogs/${slug}`),
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<{ url: string }>("/api/upload", formData);
    return res.data;
  },
  myDrafts: () =>
    api.get<BlogRead[]>("/api/blogs/my-drafts").then(r => r.data),
  getLike: (slug: string) =>
    api.get<{ likes: number; liked: boolean }>(`/api/blogs/${slug}/like`).then(r => r.data),
  toggleLike: (slug: string) =>
    api.post<{ likes: number; liked: boolean }>(`/api/blogs/${slug}/like`).then(r => r.data),
  getComments: (slug: string) =>
    api.get<BlogComment[]>(`/api/blogs/${slug}/comments`).then(r => r.data),
  addComment: (slug: string, content: string, parent_id?: string) =>
    api.post<BlogComment>(`/api/blogs/${slug}/comments`, { content, parent_id: parent_id ?? null }).then(r => r.data),
  deleteComment: (slug: string, commentId: string) =>
    api.delete(`/api/blogs/${slug}/comments/${commentId}`),
  toggleComments: (slug: string) =>
    api.patch<{ comments_enabled: boolean }>(`/api/blogs/${slug}/comments/toggle`).then(r => r.data),
};

export default api;
