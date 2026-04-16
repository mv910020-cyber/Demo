from pydantic import BaseModel


class DashboardOverview(BaseModel):
    total_demos: int
    conversion_rate: float
    no_show_rate: float
    demos_by_status: dict[str, int]
    demos_by_product: dict[str, int]
    loss_reasons: dict[str, int]
    common_feature_requests: list[dict[str, int]]


class DashboardOpsSummary(BaseModel):
    unassigned_new_requests: int
    upcoming_24h_demos: int
    upcoming_conflict_count: int


class DeadLetterReminderItem(BaseModel):
    reminder_id: int
    demo_id: int
    company_name: str
    channel: str
    attempt_count: int
    max_attempts: int
    failure_reason: str | None
    remind_at: str


class DeadLetterReminderReport(BaseModel):
    total_failed_reminders: int
    items: list[DeadLetterReminderItem]
