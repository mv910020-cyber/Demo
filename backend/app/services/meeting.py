from datetime import datetime
from uuid import uuid4
import logging
from urllib.parse import quote_plus

from app.models.enums import MeetingProvider
from app.services.meetings.factory import MeetingFactory


logger = logging.getLogger(__name__)


class MeetingService:
    @staticmethod
    def create_meeting_link(
        provider: MeetingProvider,
        title: str,
        start_time: datetime,
        duration_minutes: int = 60,
        attendees: list[str] | None = None,
    ) -> str:
        adapter = MeetingFactory.get_adapter(provider)
        try:
            return adapter.create_meeting(title, start_time, duration_minutes, attendees or [])
        except ValueError as exc:
            fallback_id = uuid4().hex[:12]
            logger.warning("Falling back to internal meeting link for %s: %s", provider.value, exc)
            return (
                f"https://meetings.local/{provider.value}/{fallback_id}"
                f"?title={quote_plus(title)}&start={quote_plus(start_time.isoformat())}"
            )
