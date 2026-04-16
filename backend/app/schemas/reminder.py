from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import ReminderChannel, ReminderStatus


class ReminderCreate(BaseModel):
    channel: ReminderChannel
    remind_at: datetime
    max_attempts: int = 3


class ReminderRead(BaseModel):
    id: int
    demo_id: int
    channel: ReminderChannel
    remind_at: datetime
    attempt_count: int
    max_attempts: int
    status: ReminderStatus
    failure_reason: str | None
    sent_at: datetime | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
