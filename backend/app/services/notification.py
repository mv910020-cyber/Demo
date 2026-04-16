import logging

from app.models.demo import Demo
from app.models.enums import ReminderChannel
from app.services.email_service import EmailService
from app.services.message_templates import MessageTemplateService
from app.services.whatsapp_service import WhatsAppService


logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def send_schedule_notifications(demo: Demo) -> None:
        email_subject, email_body = MessageTemplateService.schedule_message(demo, ReminderChannel.EMAIL)
        if not EmailService.send_email(demo.contact_email, email_subject, email_body):
            logger.warning("Failed to send schedule email for demo %s", demo.id)
        if demo.contact_phone:
            _, whatsapp_body = MessageTemplateService.schedule_message(demo, ReminderChannel.WHATSAPP)
            if not WhatsAppService.send_message(demo.contact_phone, whatsapp_body):
                logger.warning("Failed to send schedule WhatsApp message for demo %s", demo.id)

    @staticmethod
    def send_status_notification(demo: Demo) -> None:
        email_subject, email_body = MessageTemplateService.status_message(demo, ReminderChannel.EMAIL)
        if not EmailService.send_email(demo.contact_email, email_subject, email_body):
            logger.warning("Failed to send status email for demo %s", demo.id)
        if demo.contact_phone:
            _, whatsapp_body = MessageTemplateService.status_message(demo, ReminderChannel.WHATSAPP)
            if not WhatsAppService.send_message(demo.contact_phone, whatsapp_body):
                logger.warning("Failed to send status WhatsApp message for demo %s", demo.id)
