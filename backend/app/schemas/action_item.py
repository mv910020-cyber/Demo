from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import Priority, TaskStatus


class ActionItemCreate(BaseModel):
    title: str
    details: str | None = None
    owner: str
    deadline: datetime | None = None
    priority: Priority = Priority.MEDIUM


class ActionItemUpdate(BaseModel):
    title: str | None = None
    details: str | None = None
    owner: str | None = None
    deadline: datetime | None = None
    priority: Priority | None = None
    status: TaskStatus | None = None


class ActionItemRead(BaseModel):
    id: int
    demo_id: int
    title: str
    details: str | None
    owner: str
    deadline: datetime | None
    priority: Priority
    status: TaskStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
