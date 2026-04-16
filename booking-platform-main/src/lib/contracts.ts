export type Role = "admin" | "sales" | "technical" | "management";
export type DemoStatus = "new" | "scheduled" | "confirmed" | "completed" | "follow_up" | "converted" | "lost";
export type DemoType = "online" | "offline";
export type MeetingProvider = "google_meet" | "zoom" | "teams";
export type ReminderChannel = "email" | "whatsapp";
export type ReminderStatus = "pending" | "sent" | "failed";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "open" | "in_progress" | "done";
export type RequirementStatus = "new" | "planned" | "in_progress" | "shipped" | "rejected";

export interface UserRecord {
  id: number;
  full_name: string;
  email: string;
  password_hash?: string;
  role: Role;
  created_at: string;
}

export interface AvailabilityRecord {
  id: number;
  user_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface DemoRecord {
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
  action_items: ActionItemRecord[];
  requirements: RequirementRecord[];
  reminders: ReminderRecord[];
}

export interface ReminderRecord {
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

export interface ActionItemRecord {
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

export interface RequirementRecord {
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

export interface DemoCreatePayload {
  product_interest: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string | null;
  preferred_datetime?: string | null;
  demo_type: DemoType;
  use_case_notes?: string | null;
}

export interface DemoSchedulePayload {
  sales_rep_id?: number;
  technical_presenter_id?: number;
  final_datetime: string;
  meeting_provider: MeetingProvider;
}

export interface DemoRecordingPayload {
  recording_url: string;
  recording_notes?: string | null;
}

export interface DemoStatusPayload {
  status: DemoStatus;
  lost_reason?: string | null;
}

export interface DashboardOverviewContract {
  total_demos: number;
  conversion_rate: number;
  no_show_rate: number;
  demos_by_status: Record<string, number>;
  demos_by_product: Record<string, number>;
  loss_reasons: Record<string, number>;
  common_feature_requests: Array<{ title: string; count: number }>;
}

export interface DashboardOpsSummaryContract {
  unassigned_new_requests: number;
  upcoming_24h_demos: number;
  upcoming_conflict_count: number;
}

export interface DeadLetterReminderItemContract {
  reminder_id: number;
  demo_id: number;
  company_name: string;
  channel: ReminderChannel | string;
  attempt_count: number;
  max_attempts: number;
  failure_reason: string | null;
  remind_at: string;
}

export interface DeadLetterReminderReportContract {
  total_failed_reminders: number;
  items: DeadLetterReminderItemContract[];
}
