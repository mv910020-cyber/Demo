from datetime import datetime, timedelta

from app.core.datetime_utils import utcnow_naive
from app.models.demo import Demo
from app.models.enums import DemoStatus, DemoType, ReminderChannel, ReminderStatus
from app.models.reminder import DemoReminder
from app.core.config import settings
from app.services.email_service import EmailService
from app.services.reminder_dispatcher import ReminderDispatcher


def test_reminder_retries_then_marks_sent(db_session, monkeypatch):
    demo = Demo(
        product_interest="FastHire99",
        company_name="Gamma",
        contact_name="Gary",
        contact_email="gary@example.com",
        contact_phone="+10000000000",
        demo_type=DemoType.ONLINE,
        status=DemoStatus.SCHEDULED,
        final_datetime=utcnow_naive() + timedelta(hours=2),
        meeting_link="https://meet.example/link",
    )
    db_session.add(demo)
    db_session.commit()
    db_session.refresh(demo)

    reminder = DemoReminder(
        demo_id=demo.id,
        channel=ReminderChannel.EMAIL,
        remind_at=utcnow_naive() - timedelta(minutes=1),
        max_attempts=3,
    )
    db_session.add(reminder)
    db_session.commit()
    db_session.refresh(reminder)

    def fail_send(*_, **__):
        raise RuntimeError("temporary smtp failure")

    monkeypatch.setattr(EmailService, "send_email", fail_send)
    ReminderDispatcher.process_due_reminders(db_session)

    db_session.refresh(reminder)
    assert reminder.status == ReminderStatus.PENDING
    assert reminder.attempt_count == 1
    assert reminder.failure_reason is not None
    first_retry_time = reminder.remind_at

    reminder.remind_at = utcnow_naive() - timedelta(seconds=1)
    db_session.add(reminder)
    db_session.commit()

    ReminderDispatcher.process_due_reminders(db_session)
    db_session.refresh(reminder)
    second_retry_time = reminder.remind_at
    assert reminder.status == ReminderStatus.PENDING
    assert reminder.attempt_count == 2
    assert second_retry_time > first_retry_time

    min_gap = timedelta(minutes=settings.reminder_retry_delay_minutes)
    assert second_retry_time - first_retry_time >= min_gap

    monkeypatch.setattr(EmailService, "send_email", lambda *_, **__: True)
    reminder.remind_at = utcnow_naive() - timedelta(seconds=1)
    db_session.add(reminder)
    db_session.commit()

    ReminderDispatcher.process_due_reminders(db_session)
    db_session.refresh(reminder)

    assert reminder.status == ReminderStatus.SENT
    assert reminder.sent_at is not None
