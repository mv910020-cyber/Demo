from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.enums import Priority, RequirementStatus


class RequirementCreate(BaseModel):
    title: str
    description: str | None = None
    assigned_team: str | None = None
    priority: Priority = Priority.MEDIUM


class RequirementUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    assigned_team: str | None = None
    priority: Priority | None = None
    status: RequirementStatus | None = None


class RequirementRead(BaseModel):
    id: int
    demo_id: int
    title: str
    description: str | None
    assigned_team: str | None
    priority: Priority
    status: RequirementStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
