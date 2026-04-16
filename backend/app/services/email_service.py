import logging
from email.message import EmailMessage
from smtplib import SMTP, SMTPAuthenticationError, SMTPException, SMTP_SSL

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str) -> bool:
        if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
            logger.warning("SMTP is not configured")
            return False

        message = EmailMessage()
        message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email or settings.smtp_user}>"
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        try:
            secure_mode = settings.smtp_secure.strip().lower()
            use_ssl = secure_mode in {"ssl", "smtps", "implicit_ssl"} or settings.smtp_port == 465
            if use_ssl:
                smtp_client = SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=20)
            else:
                smtp_client = SMTP(settings.smtp_host, settings.smtp_port, timeout=20)

            with smtp_client as smtp:
                if secure_mode in {"starttls", "tls", "auto"} or (not use_ssl and settings.smtp_port in {587, 25}):
                    smtp.ehlo()
                    if smtp.has_extn("starttls"):
                        smtp.starttls()
                        smtp.ehlo()
                    else:
                        logger.warning(
                            "SMTP server %s:%s does not advertise STARTTLS; continuing without TLS",
                            settings.smtp_host,
                            settings.smtp_port,
                        )
                smtp.login(settings.smtp_user, settings.smtp_password)
                smtp.send_message(message)
            logger.info(f"Email sent to {to_email}")
            return True
        except SMTPAuthenticationError as exc:
            logger.warning(f"SMTP authentication failed: {exc}")
            return False
        except SMTPException as exc:
            logger.warning(f"Failed to send email to {to_email}: {exc}")
            return False
