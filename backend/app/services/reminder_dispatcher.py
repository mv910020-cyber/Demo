from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.datetime_utils import utcnow_naive
from app.models.enums import ReminderChannel, ReminderStatus
from app.models.reminder import DemoReminder
from app.services.email_service import EmailService
from app.services.message_templates import MessageTemplateService
from app.services.whatsapp_service import WhatsAppService


class ReminderDispatcher:
    @staticmethod
    def _next_retry_time(now: datetime, attempt_count: int) -> datetime:
        base = max(1, settings.reminder_retry_delay_minutes)
        max_delay = max(base, settings.reminder_retry_max_delay_minutes)
        delay_minutes = min(base * (2 ** max(0, attempt_count - 1)), max_delay)
        return now.replace(microsecond=0) + timedelta(minutes=delay_minutes)

    @staticmethod
    def process_due_reminders(db: Session) -> int:
        now = utcnow_naive()
        reminders = (
            db.query(DemoReminder)
            .filter(DemoReminder.status == ReminderStatus.PENDING, DemoReminder.remind_at <= now)
            .all()
        )

        sent_count = 0
        for reminder in reminders:
            demo = reminder.demo
            subject, message = MessageTemplateService.reminder_message(demo, reminder.channel)
            try:
                if reminder.channel == ReminderChannel.EMAIL:
                        if not EmailService.send_email(demo.contact_email, subject, message):
                            raise RuntimeError("Email delivery failed")
                elif reminder.channel == ReminderChannel.WHATSAPP and demo.contact_phone:
                        if not WhatsAppService.send_message(demo.contact_phone, message):
                            raise RuntimeError("WhatsApp delivery failed")

                reminder.status = ReminderStatus.SENT
                reminder.sent_at = now
                reminder.failure_reason = None
                sent_count += 1
            except Exception as exc:
                reminder.attempt_count += 1
                if reminder.attempt_count >= reminder.max_attempts:
                    reminder.status = ReminderStatus.FAILED
                else:
                    reminder.status = ReminderStatus.PENDING
                    reminder.remind_at = ReminderDispatcher._next_retry_time(now, reminder.attempt_count)
                reminder.failure_reason = str(exc)

            db.add(reminder)

        if reminders:
            db.commit()
        return sent_count
