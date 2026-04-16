from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import DemoStatus, DemoType, MeetingProvider, ReminderChannel
from app.schemas.action_item import ActionItemRead
from app.schemas.reminder import ReminderRead
from app.schemas.requirement import RequirementRead


class DemoCreate(BaseModel):
    product_interest: str
    company_name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str | None = None
    preferred_datetime: datetime | None = None
    demo_type: DemoType
    use_case_notes: str | None = None


class DemoSchedule(BaseModel):
    sales_rep_id: int | None = None
    technical_presenter_id: int | None = None
    final_datetime: datetime
    meeting_provider: MeetingProvider


class DemoStatusUpdate(BaseModel):
    status: DemoStatus
    lost_reason: str | None = None


class DemoPostNotes(BaseModel):
    client_feedback: str | None = None
    pain_points: str | None = None
    requirements_notes: str | None = None
    budget_signals: str | None = None
    expected_timeline: str | None = None


class DemoRecordingUpdate(BaseModel):
    recording_url: str
    recording_notes: str | None = None


class DemoSendInviteRequest(BaseModel):
    channel: ReminderChannel


class DemoSendInviteResponse(BaseModel):
    channel: ReminderChannel
    sent: bool
    detail: str


class DemoRead(BaseModel):
    id: int
    product_interest: str
    company_name: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: str | None
    preferred_datetime: datetime | None
    final_datetime: datetime | None
    demo_type: DemoType
    use_case_notes: str | None
    status: DemoStatus
    sales_rep_id: int | None
    technical_presenter_id: int | None
    meeting_provider: MeetingProvider | None
    meeting_link: str | None
    client_feedback: str | None
    pain_points: str | None
    requirements_notes: str | None
    budget_signals: str | None
    expected_timeline: str | None
    lost_reason: str | None
    recording_url: str | None
    recording_notes: str | None
    recording_uploaded_at: datetime | None
    created_at: datetime
    updated_at: datetime
    action_items: list[ActionItemRead] = Field(default_factory=list)
    requirements: list[RequirementRead] = Field(default_factory=list)
    reminders: list[ReminderRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
