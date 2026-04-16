from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.datetime_utils import utcnow_naive
from app.db.base import Base
from app.models.enums import ReminderChannel, ReminderStatus


class DemoReminder(Base):
    __tablename__ = "demo_reminders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    demo_id: Mapped[int] = mapped_column(ForeignKey("demos.id"), nullable=False, index=True)
    channel: Mapped[ReminderChannel] = mapped_column(
        Enum(ReminderChannel, name="reminder_channel", values_callable=lambda cls: [item.value for item in cls]),
        nullable=False,
    )
    remind_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    attempt_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    status: Mapped[ReminderStatus] = mapped_column(
        Enum(ReminderStatus, name="reminder_status", values_callable=lambda cls: [item.value for item in cls]),
        default=ReminderStatus.PENDING,
        nullable=False,
        index=True,
    )
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow_naive, nullable=False)

    demo = relationship("Demo", back_populates="reminders")
