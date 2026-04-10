/// <reference types="vite/client" />

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const getToken = () => localStorage.getItem("talent_token");
let inFlightRequestCount = 0;

const emitGlobalLoader = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("global-api-loading", {
      detail: { isLoading: inFlightRequestCount > 0, count: inFlightRequestCount },
    })
  );
};

const startRequest = () => {
  inFlightRequestCount += 1;
  emitGlobalLoader();
};

const endRequest = () => {
  inFlightRequestCount = Math.max(0, inFlightRequestCount - 1);
  emitGlobalLoader();
};

const request = async (path, options = {}) => {
  startRequest();
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    if (!response.ok) {
      let message = `Request failed with status ${response.status}`;
      let code;
      try {
        const err = await response.json();
        if (err?.message) message = err.message;
        if (err?.code) code = err.code;
      } catch (_error) {
        // ignore parse errors
      }
      const error = new Error(message);
      if (code) error.code = code;
      error.status = response.status;
      throw error;
    }
    return response.json();
  } finally {
    endRequest();
  }
};

export const apiClient = {
  auth: {
    async me() {
      const token = getToken();
      if (!token) return null;
      const { user } = await request("/api/auth/me", { headers: {} });
      localStorage.setItem("talent_user", JSON.stringify(user));
      return user;
    },
    async signup(payload) {
      return request("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async verifyEmailOtp(payload) {
      const { token, user } = await request("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("talent_token", token);
      localStorage.setItem("talent_user", JSON.stringify(user));
      return user;
    },
    async resendVerifyOtp(payload) {
      return request("/api/auth/resend-verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async login(payload) {
      const { token, user } = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("talent_token", token);
      localStorage.setItem("talent_user", JSON.stringify(user));
      return user;
    },
    async forgotPassword(payload) {
      return request("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async resetPassword(payload) {
      return request("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async updateProfile(payload) {
      const { user } = await request("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      localStorage.setItem("talent_user", JSON.stringify(user));
      return user;
    },
    logout() {
      localStorage.removeItem("talent_user");
      localStorage.removeItem("talent_token");
    },
    redirectToLogin() {
      window.location.href = "/";
    },
  },
  jobs: {
    async listOpen() {
      return request("/api/jobs");
    },
    async getById(id) {
      return request(`/api/jobs/${id}`);
    },
    async create(payload) {
      return request("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async extractFromPdf(file) {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await request("/api/jobs/extract", { method: "POST", body: formData });
      return data;
    },
    async delete(id) {
      return request(`/api/jobs/${id}`, { method: "DELETE" });
    },
  },
  recruiter: {
    async listMyJobs() {
      return request("/api/recruiter/jobs");
    },
    async getJob(jobId) {
      return request(`/api/recruiter/jobs/${jobId}`);
    },
    async listApplications(jobId) {
      return request(`/api/recruiter/jobs/${jobId}/applications`);
    },
    async updateApplicationStatus(id, status) {
      return request(`/api/recruiter/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
  },
  applications: {
    async listMine() {
      return request("/api/applications");
    },
    async apply(payload) {
      return request("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  },
  interviews: {
    async listHosts() {
      return request("/api/interviews/hosts");
    },
    async getAvailability(userId, date) {
      const q = new URLSearchParams({ date });
      return request(`/api/interviews/availability/${userId}?${q.toString()}`);
    },
    async createBooking(payload) {
      return request("/api/interviews/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async getMySchedule() {
      return request("/api/interviews/my-schedule");
    },
    async addMyBusy(payload) {
      return request("/api/interviews/my-busy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    async removeMyBusy(date, timeSlot) {
      const q = new URLSearchParams({ date, timeSlot });
      return request(`/api/interviews/my-busy?${q.toString()}`, { method: "DELETE" });
    },
  },
  executive: {
    async getOverview() {
      return request("/api/executive/overview");
    },
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const formData = new FormData();
        formData.append("file", file);
        return request("/api/uploads", { method: "POST", body: formData });
      },
      async InvokeLLM(payload) {
        const { data } = await request("/api/ai/invoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return data;
      },
      async SendEmail(payload) {
        const { to, subject, body, includeSignature } = payload;
        return request("/api/ai/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            subject,
            body,
            ...(includeSignature === false ? { includeSignature: false } : {}),
          }),
        });
      },
      async DeleteFile({ file_url }) {
        const params = new URLSearchParams({ file_url });
        return request(`/api/uploads?${params.toString()}`, {
          method: "DELETE",
        });
      },
    },
  },
};
