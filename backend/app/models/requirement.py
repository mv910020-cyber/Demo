from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.datetime_utils import utcnow_naive
from app.db.base import Base
from app.models.enums import Priority, RequirementStatus


class Requirement(Base):
    __tablename__ = "requirements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    demo_id: Mapped[int] = mapped_column(ForeignKey("demos.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_team: Mapped[str | None] = mapped_column(String(120), nullable=True)
    priority: Mapped[Priority] = mapped_column(
        Enum(Priority, name="priority", values_callable=lambda cls: [item.value for item in cls]),
        default=Priority.MEDIUM,
        nullable=False,
    )
    status: Mapped[RequirementStatus] = mapped_column(
        Enum(RequirementStatus, name="requirement_status", values_callable=lambda cls: [item.value for item in cls]),
        default=RequirementStatus.NEW,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow_naive,
        onupdate=utcnow_naive,
        nullable=False,
    )

    demo = relationship("Demo", back_populates="requirements")
