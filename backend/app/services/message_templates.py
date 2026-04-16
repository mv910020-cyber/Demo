from app.models.demo import Demo
from app.models.enums import ReminderChannel


class MessageTemplateService:
    @staticmethod
    def schedule_message(demo: Demo, channel: ReminderChannel) -> tuple[str, str]:
        subject = f"Demo scheduled for {demo.company_name}"
        body = (
            f"Your demo has been scheduled.\n\n"
            f"Product: {demo.product_interest}\n"
            f"Date/Time: {demo.final_datetime}\n"
            f"Meeting Link: {demo.meeting_link or 'Not available'}\n"
        )
        if channel == ReminderChannel.WHATSAPP:
            body = (
                f"Demo scheduled: {demo.product_interest} for {demo.company_name}.\n"
                f"Time: {demo.final_datetime}\n"
                f"Link: {demo.meeting_link or 'Not available'}"
            )
        return subject, body

    @staticmethod
    def status_message(demo: Demo, channel: ReminderChannel) -> tuple[str, str]:
        subject = f"Demo status updated to {demo.status.value}"
        body = (
            f"The demo for {demo.company_name} moved to {demo.status.value}.\n"
            f"Meeting Link: {demo.meeting_link or 'Not available'}\n"
        )
        if channel == ReminderChannel.WHATSAPP:
            body = (
                f"Demo status update for {demo.company_name}: {demo.status.value}.\n"
                f"Link: {demo.meeting_link or 'Not available'}"
            )
        return subject, body

    @staticmethod
    def reminder_message(demo: Demo, channel: ReminderChannel) -> tuple[str, str]:
        subject = f"Reminder: Demo for {demo.company_name}"
        body = (
            f"Reminder: Your demo is scheduled at {demo.final_datetime}.\n"
            f"Meeting link: {demo.meeting_link or 'Not available'}"
        )
        if channel == ReminderChannel.WHATSAPP:
            body = (
                f"Reminder: Demo at {demo.final_datetime} for {demo.company_name}.\n"
                f"Link: {demo.meeting_link or 'Not available'}"
            )
        return subject, body
