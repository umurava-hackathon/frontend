import axios from "axios";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

// Helper to handle and format API errors for the client
export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.error;

    if (status === 400) return backendMessage || "Invalid request. Please check your input.";
    if (status === 401) return "Session expired. Please log in again.";
    if (status === 403) return "You don't have permission to perform this action.";
    if (status === 404) return "The requested resource was not found.";
    if (status === 429) return "Too many requests. Please wait a moment and try again.";
    if (status && status >= 500) return "Our server is having trouble. Please try again later.";
    
    if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
    if (!status) return "Network error. Please check your internet connection.";
  }
  return "An unexpected error occurred. Please try again.";
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // important for cookies
});

let accessToken: string | null = null;
let store: any = null;

export const injectStore = (_store: any) => {
  store = _store;
};

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor: handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Trigger refresh if token is expired OR if no token was provided (new tab scenario)
    const isUnauthorized = error.response?.status === 401;
    const isExpired = error.response?.data?.code === "TOKEN_EXPIRED";
    const isMissing = error.response?.data?.code === "UNAUTHORIZED" && !accessToken;

    if (isUnauthorized && (isExpired || isMissing) && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true });
        accessToken = data.data.accessToken;
        
        // Update Redux state if store was injected
        if (store) {
          const { setAccessToken } = require("../store/slices/dashboardSlice");
          store.dispatch(setAccessToken(accessToken));
        }
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        accessToken = null;
        if (store) {
          const { clearAuth } = require("../store/slices/dashboardSlice");
          store.dispatch(clearAuth());
        }
        // Only redirect if we aren't already on the login/register pages
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// --- Auth API ---
export async function apiLogin(credentials: any) {
  const res = await api.post("/auth/login", credentials);
  accessToken = res.data.data.accessToken;
  return res.data;
}

export async function apiRegister(userData: any) {
  const res = await api.post("/auth/register", userData);
  accessToken = res.data.data.accessToken;
  return res.data;
}

export async function apiLogout() {
  await api.post("/auth/logout");
  accessToken = null;
}

export async function apiGetMe() {
  const res = await api.get("/auth/me");
  return res.data;
}

// --- Dashboard API ---
export async function apiGetDashboardStats() {
  const res = await api.get("/dashboard/stats");
  return res.data;
}

export async function apiGetRecentJobs() {
  const res = await api.get("/dashboard/recent-jobs");
  return res.data;
}

export async function apiGetRecentActivity() {
  const res = await api.get("/dashboard/activity");
  return res.data;
}

// --- Account API ---
export async function apiGetAccountProfile() {
  const res = await api.get("/account/profile");
  return res.data;
}

export async function apiUpdateAccountProfile(payload: any) {
  const res = await api.patch("/account/profile", payload);
  return res.data;
}

export async function apiUpdateAccountPassword(payload: any) {
  const res = await api.patch("/account/password", payload);
  return res.data;
}

export async function apiGetAccountSessions() {
  const res = await api.get("/account/sessions");
  return res.data;
}

export async function apiRevokeSession(sessionId: string) {
  const res = await api.delete(`/account/sessions/${encodeURIComponent(sessionId)}`);
  return res.data;
}

export async function apiRevokeAllOtherSessions() {
  const res = await api.delete("/account/sessions");
  return res.data;
}

// --- Jobs API ---
export async function apiListJobs(params?: { status?: string; limit?: number }): Promise<{ data: any[] }> {
  const res = await api.get("/jobs", { params });
  return res.data;
}

export async function apiGetJob(jobId: string): Promise<{ data: any }> {
  const res = await api.get(`/jobs/${encodeURIComponent(jobId)}`);
  return res.data;
}

export async function apiCreateJob(payload: any): Promise<{ data: any }> {
  const res = await api.post("/jobs", payload);
  return res.data;
}

export async function apiUpdateJob(jobId: string, payload: any): Promise<{ data: any }> {
  const res = await api.put(`/jobs/${encodeURIComponent(jobId)}`, payload);
  return res.data;
}

export async function apiDeleteJob(jobId: string): Promise<any> {
  const res = await api.delete(`/jobs/${encodeURIComponent(jobId)}`);
  return res.data;
}

// --- Applicants API ---
export async function apiGetJobApplicants(jobId: string): Promise<{ data: any[] }> {
  const res = await api.get(`/jobs/${encodeURIComponent(jobId)}/applicants`);
  return res.data;
}

export async function apiIngestUmuravaProfiles(jobId: string, profiles: any[]): Promise<any> {
  const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/applicants/profiles`, { profiles });
  return res.data;
}

export async function apiIngestCsv(jobId: string, csvFile: File, mapping?: any): Promise<any> {
  const form = new FormData();
  form.append("file", csvFile);
  if (mapping) form.append("mapping", JSON.stringify(mapping));
  const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/applicants/csv`, form);
  return res.data;
}

export async function apiIngestZip(jobId: string, zipFile: File): Promise<any> {
  const form = new FormData();
  form.append("file", zipFile);
  const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/applicants/zip`, form);
  return res.data;
}

export async function apiBulkUploadResumes(jobId: string, files: File[]): Promise<any> {
  const form = new FormData();
  files.forEach(file => form.append("resumes", file));
  const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/applicants/bulk-resumes`, form);
  return res.data;
}

export async function apiUploadResume(jobId: string, applicantId: string, pdfFile: File): Promise<any> {
  const form = new FormData();
  form.append("file", pdfFile);
  form.append("applicantId", applicantId);
  const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/applicants/resume`, form);
  return res.data;
}

// --- Screening API ---
export async function apiTriggerScreening(jobId: string, topN?: number): Promise<any> {
  const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/screen`, { topN });
  return res.data;
}

export async function apiListJobResults(jobId: string): Promise<{ data: any[] }> {
  const res = await api.get(`/jobs/${encodeURIComponent(jobId)}/results`);
  return res.data;
}

export async function apiGetJobResults(jobId: string): Promise<{ data: any }> {
  const res = await api.get(`/jobs/${encodeURIComponent(jobId)}/results/latest`);
  return res.data;
}

export async function apiGetCandidateReasoning(applicantId: string): Promise<{ data: any }> {
  const res = await api.get(`/applicants/${encodeURIComponent(applicantId)}/reasoning`);
  return res.data;
}

// --- AI Assistants ---
export async function apiGenerateJobDescription(prompt: string): Promise<{ description: string }> {
  const res = await api.post("/ai/generate-job-description", { prompt });
  return res.data;
}

export async function apiChatWithShortlist(jobId: string, message: string, history: any[]): Promise<{ reply: string }> {
  const res = await api.post(`/jobs/${encodeURIComponent(jobId)}/chat`, { message, history });
  return res.data;
}

export async function apiChatWithDashboard(message: string, history: any[]): Promise<{ reply: string }> {
  const res = await api.post("/ai/dashboard-chat", { message, history });
  return res.data;
}
