from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.datetime_utils import utcnow_naive
from app.db.base import Base
from app.models.enums import DemoStatus, DemoType, MeetingProvider


class Demo(Base):
    __tablename__ = "demos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    product_interest: Mapped[str] = mapped_column(String(50), nullable=False)
    company_name: Mapped[str] = mapped_column(String(150), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    preferred_datetime: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    final_datetime: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    demo_type: Mapped[DemoType] = mapped_column(
        Enum(DemoType, name="demo_type", values_callable=lambda cls: [item.value for item in cls]),
        nullable=False,
    )
    use_case_notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[DemoStatus] = mapped_column(
        Enum(DemoStatus, name="demo_status", values_callable=lambda cls: [item.value for item in cls]),
        default=DemoStatus.NEW,
        nullable=False,
    )

    sales_rep_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    technical_presenter_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    meeting_provider: Mapped[MeetingProvider | None] = mapped_column(
        Enum(MeetingProvider, name="meeting_provider", values_callable=lambda cls: [item.value for item in cls]),
        nullable=True,
    )
    meeting_link: Mapped[str | None] = mapped_column(String(500), nullable=True)

    client_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    pain_points: Mapped[str | None] = mapped_column(Text, nullable=True)
    requirements_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    budget_signals: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_timeline: Mapped[str | None] = mapped_column(String(120), nullable=True)
    lost_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    recording_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recording_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recording_uploaded_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utcnow_naive,
        onupdate=utcnow_naive,
        nullable=False,
    )

    sales_rep = relationship("User", foreign_keys=[sales_rep_id], back_populates="sales_demos")
    technical_presenter = relationship(
        "User",
        foreign_keys=[technical_presenter_id],
        back_populates="technical_demos",
    )
    action_items = relationship("ActionItem", back_populates="demo", cascade="all, delete-orphan")
    requirements = relationship("Requirement", back_populates="demo", cascade="all, delete-orphan")
    reminders = relationship("DemoReminder", back_populates="demo", cascade="all, delete-orphan")
