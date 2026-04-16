from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

from app.models.enums import Role


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: Role


class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: Role
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
