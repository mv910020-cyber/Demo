export type UserRole = "admin" | "sales" | "technical" | "management";
export type DemoStatus =
  | "new"
  | "scheduled"
  | "confirmed"
  | "completed"
  | "follow_up"
  | "converted"
  | "lost";

export type DemoType = "online" | "offline";
export type MeetingProvider = "google_meet" | "zoom" | "teams";
export type ReminderChannel = "email" | "whatsapp";
export type ReminderStatus = "pending" | "sent" | "failed";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "done";
export type RequirementStatus = "new" | "planned" | "in_progress" | "shipped" | "rejected";

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface ActionItem {
  id: number;
  demo_id: number;
  title: string;
  details: string | null;
  owner: string;
  deadline: string | null;
  priority: Priority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface Requirement {
  id: number;
  demo_id: number;
  title: string;
  description: string | null;
  assigned_team: string | null;
  priority: Priority;
  status: RequirementStatus;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: number;
  demo_id: number;
  channel: ReminderChannel;
  remind_at: string;
  attempt_count: number;
  max_attempts: number;
  status: ReminderStatus;
  failure_reason: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface Demo {
  id: number;
  product_interest: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  preferred_datetime: string | null;
  final_datetime: string | null;
  demo_type: DemoType;
  use_case_notes: string | null;
  status: DemoStatus;
  sales_rep_id: number | null;
  technical_presenter_id: number | null;
  meeting_provider: MeetingProvider | null;
  meeting_link: string | null;
  client_feedback: string | null;
  pain_points: string | null;
  requirements_notes: string | null;
  budget_signals: string | null;
  expected_timeline: string | null;
  lost_reason: string | null;
  recording_url: string | null;
  recording_notes: string | null;
  recording_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
  action_items: ActionItem[];
  requirements: Requirement[];
  reminders: Reminder[];
}

export interface DashboardOverview {
  total_demos: number;
  conversion_rate: number;
  no_show_rate: number;
  demos_by_status: Record<string, number>;
  demos_by_product: Record<string, number>;
  loss_reasons: Record<string, number>;
  common_feature_requests: Array<{ title: string; count: number }>;
}

export interface DashboardOpsSummary {
  unassigned_new_requests: number;
  upcoming_24h_demos: number;
  upcoming_conflict_count: number;
}

export interface DeadLetterReminderItem {
  reminder_id: number;
  demo_id: number;
  company_name: string;
  channel: string;
  attempt_count: number;
  max_attempts: number;
  failure_reason: string | null;
  remind_at: string;
}

export interface DeadLetterReminderReport {
  total_failed_reminders: number;
  items: DeadLetterReminderItem[];
}

export interface ActionItemPayload {
  title: string;
  details?: string | null;
  owner: string;
  deadline?: string | null;
  priority?: Priority;
  status?: TaskStatus;
}

export interface RequirementPayload {
  title: string;
  description?: string | null;
  assigned_team?: string | null;
  priority?: Priority;
  status?: RequirementStatus;
}

export interface ReminderPayload {
  channel: ReminderChannel;
  remind_at: string;
}

export interface SendInviteResponse {
  channel: ReminderChannel;
  sent: boolean;
  detail: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api/v1";

const TOKEN_KEY = "demo_platform_token";

function getCookieToken(name: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const all = document.cookie.split(";").map((c) => c.trim());
    const found = all.find((c) => c.startsWith(`${name}=`));
    if (!found) return null;
    return decodeURIComponent(found.slice(name.length + 1));
  } catch (error) {
    console.error("Error reading cookie:", error);
    return null;
  }
}

export const authStorage = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY) || getCookieToken(TOKEN_KEY);
  },
  setToken(token: string): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TOKEN_KEY, token);
    document.cookie = `${TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  },
  clearToken(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(TOKEN_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; samesite=lax`;
  },
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  authRequired = true,
): Promise<T> {
  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  if (authRequired) {
    const token = authStorage.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let detail = "Request failed";
    try {
      const json = await response.json();
      detail = json.detail || detail;
    } catch {
      detail = response.statusText || detail;
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const api = {
  login(email: string, password: string) {
    return request<{ access_token: string; token_type: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      false,
    );
  },

  register(payload: {
    full_name: string;
    email: string;
    password: string;
    role: UserRole;
  }) {
    return request<User>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      false,
    );
  },

  getMe() {
    return request<User>("/users/me");
  },

  listUsers() {
    return request<User[]>("/users/");
  },

  listDemos(params?: { demo_status?: DemoStatus; product_interest?: string }) {
    const query = new URLSearchParams();
    if (params?.demo_status) query.set("demo_status", params.demo_status);
    if (params?.product_interest) query.set("product_interest", params.product_interest);
    const queryStr = query.toString();
    return request<Demo[]>(`/demos/${queryStr ? `?${queryStr}` : ""}`);
  },

  getDemo(id: string | number) {
    return request<Demo>(`/demos/${id}`);
  },

  createDemo(payload: {
    product_interest: string;
    company_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone?: string | null;
    preferred_datetime?: string | null;
    demo_type: DemoType;
    use_case_notes?: string | null;
  }) {
    return request<Demo>("/demos/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  scheduleDemo(
    demoId: string | number,
    payload: {
      sales_rep_id?: number;
      technical_presenter_id?: number;
      final_datetime: string;
      meeting_provider: MeetingProvider;
    },
  ) {
    return request<Demo>(`/demos/${demoId}/schedule`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateStatus(
    demoId: string | number,
    payload: { status: DemoStatus; lost_reason?: string | null },
  ) {
    return request<Demo>(`/demos/${demoId}/status`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  addPostDemoNotes(
    demoId: string | number,
    payload: {
      client_feedback?: string | null;
      pain_points?: string | null;
      requirements_notes?: string | null;
      budget_signals?: string | null;
      expected_timeline?: string | null;
    },
  ) {
    return request<Demo>(`/demos/${demoId}/post-notes`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateRecording(
    demoId: string | number,
    payload: { recording_url: string; recording_notes?: string | null },
  ) {
    return request<Demo>(`/demos/${demoId}/recording`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  listActionItems(demoId: string | number) {
    return request<ActionItem[]>(`/demos/${demoId}/action-items/`);
  },

  createActionItem(demoId: string | number, payload: ActionItemPayload) {
    return request<ActionItem>(`/demos/${demoId}/action-items/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateActionItem(demoId: string | number, actionItemId: string | number, payload: Partial<ActionItemPayload>) {
    return request<ActionItem>(`/demos/${demoId}/action-items/${actionItemId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  listRequirements(demoId: string | number) {
    return request<Requirement[]>(`/demos/${demoId}/requirements/`);
  },

  createRequirement(demoId: string | number, payload: RequirementPayload) {
    return request<Requirement>(`/demos/${demoId}/requirements/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  updateRequirement(demoId: string | number, requirementId: string | number, payload: Partial<RequirementPayload>) {
    return request<Requirement>(`/demos/${demoId}/requirements/${requirementId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  listReminders(demoId: string | number) {
    return request<Reminder[]>(`/demos/${demoId}/reminders/`);
  },

  createReminder(demoId: string | number, payload: ReminderPayload) {
    return request<Reminder>(`/demos/${demoId}/reminders/`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  sendInvite(demoId: string | number, channel: ReminderChannel) {
    return request<SendInviteResponse>(`/demos/${demoId}/send-invite`, {
      method: "POST",
      body: JSON.stringify({ channel }),
    });
  },

  getDashboardOverview() {
    return request<DashboardOverview>("/dashboard/overview");
  },

  getOpsSummary() {
    return request<DashboardOpsSummary>("/dashboard/ops-summary");
  },

  getDeadLetter(limit = 20) {
    return request<DeadLetterReminderReport>(`/dashboard/dead-letter-reminders?limit=${limit}`);
  },
};
