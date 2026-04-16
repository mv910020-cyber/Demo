import json
import logging
import socket
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings

logger = logging.getLogger(__name__)


class WhatsAppService:
    @staticmethod
    def send_message(phone_number: str, message: str) -> bool:
        if not settings.whatsapp_api_url or not settings.whatsapp_api_token:
            logger.warning("WhatsApp API is not configured")
            return False

        normalized_phone = "".join(ch for ch in phone_number if ch.isdigit()) or phone_number.strip()
        headers = {
            "Authorization": f"Bearer {settings.whatsapp_api_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": normalized_phone,
            "type": "text",
            "text": {
                "preview_url": False,
                "body": message,
            },
        }
        request = Request(
            settings.whatsapp_api_url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )
        try:
            with urlopen(request, timeout=settings.whatsapp_timeout) as response:
                response.read()
                logger.info(f"WhatsApp message sent to {phone_number}")
                return True
        except HTTPError as exc:
            error_body = ""
            if exc.fp is not None:
                try:
                    error_body = exc.fp.read().decode("utf-8", errors="ignore")
                except Exception:
                    error_body = ""

            if exc.code in {401, 403}:
                logger.warning(
                    "Failed to send WhatsApp message to %s: %s. Check WHATSAPP_API_TOKEN and Meta app permissions. %s",
                    phone_number,
                    exc,
                    error_body,
                )
            else:
                logger.warning(
                    "Failed to send WhatsApp message to %s: %s %s",
                    phone_number,
                    exc,
                    error_body,
                )
            return False
        except (URLError, socket.timeout) as exc:
            logger.warning(f"Failed to send WhatsApp message to {phone_number}: {exc}")
            return False
