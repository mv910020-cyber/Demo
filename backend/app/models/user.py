from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.datetime_utils import utcnow_naive
from app.db.base import Base
from app.models.enums import Role


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(
        Enum(Role, name="user_role", values_callable=lambda cls: [item.value for item in cls]),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)

    sales_demos = relationship("Demo", foreign_keys="Demo.sales_rep_id", back_populates="sales_rep")
    technical_demos = relationship(
        "Demo",
        foreign_keys="Demo.technical_presenter_id",
        back_populates="technical_presenter",
    )
    availabilities = relationship("UserAvailability", back_populates="user", cascade="all, delete-orphan")
