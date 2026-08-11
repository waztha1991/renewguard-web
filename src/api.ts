// In dev, Vite proxies /api to localhost:8080 (see vite.config.ts).
// In production (standalone Cloudflare deploy), set VITE_API_BASE to the
// full URL of the renewguard-backend deployment, e.g. https://api.renewguard.antsolutions.uk
const API = `${import.meta.env.VITE_API_BASE ?? ""}/api/app`;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOpts = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  const { body, ...rest } = opts;
  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (typeof body === "string") {
    payload = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  const res = await fetch(API + path, {
    credentials: "include",
    ...rest,
    headers,
    body: payload,
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!res.ok) {
    const obj = data as { error?: string; message?: string } | null;
    throw new ApiError(
      obj?.error || obj?.message || `Request failed (${res.status})`,
      res.status,
      data
    );
  }
  return data as T;
}

import type {
  AgentMe,
  LicenseStatus,
  Policy,
  ReminderLog,
  ReportsResponse,
  UploadResponse,
} from "./types";

export const api = {
  me: () => request<AgentMe>("/me"),
  login: (identifier: string, password: string) =>
    request<AgentMe>("/login", { method: "POST", body: { identifier, password } }),
  register: (body: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
  }) => request<AgentMe>("/register", { method: "POST", body }),
  logout: () => request<{ message: string }>("/logout", { method: "POST", body: {} }),
  forgotPassword: (identifier: string) =>
    request<{ message: string }>("/password-reset-requests", {
      method: "POST",
      body: { identifier },
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<AgentMe>("/change-password", {
      method: "POST",
      body: { currentPassword, newPassword },
    }),
  license: () => request<LicenseStatus>("/license"),
  activateLicense: (agentId: string, licenseKey: string) =>
    request<LicenseStatus>("/licenses/activate", {
      method: "POST",
      body: { agentId, licenseKey },
    }),
  policies: () => request<Policy[]>("/policies"),
  policy: (id: string) => request<Policy>(`/policies/${id}`),
  savePolicy: (policy: Policy) =>
    request<Policy>("/policies", { method: "PUT", body: policy }),
  deletePolicy: (id: string) =>
    request<{ message: string }>(`/policies/${id}`, { method: "DELETE" }),
  renewPolicy: (id: string) =>
    request<Policy>(`/policies/${id}/renew`, { method: "POST", body: {} }),
  reminders: (policyId: string) =>
    request<ReminderLog[]>(`/policies/${policyId}/reminders`),
  logReminder: (log: ReminderLog) =>
    request<ReminderLog>("/reminder-logs", { method: "POST", body: log }),
  reports: () => request<ReportsResponse>("/reports"),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<UploadResponse>("/upload", { method: "POST", body: fd });
  },
};

export function fileUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("/")) return path;
  return `${API}/files/${path}`;
}
