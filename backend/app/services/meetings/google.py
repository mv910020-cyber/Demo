from datetime import datetime, timedelta, timezone
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings
from app.core.datetime_utils import utcnow_naive
from app.services.meetings.base import MeetingAdapter


class GoogleMeetAdapter(MeetingAdapter):
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, attendees: list[str]) -> str:
        if not settings.google_calendar_access_token:
            raise ValueError("Google Calendar access token is required")

        end_time = start_time + timedelta(minutes=duration_minutes)
        body = {
            "summary": title,
            "start": {"dateTime": start_time.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"), "timeZone": settings.google_calendar_timezone},
            "end": {"dateTime": end_time.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"), "timeZone": settings.google_calendar_timezone},
            "attendees": [{"email": email} for email in attendees],
            "conferenceData": {
                "createRequest": {
                    "requestId": utcnow_naive().strftime("%Y%m%d%H%M%S%f"),
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }
        request = Request(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {settings.google_calendar_access_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
            return data.get("hangoutLink") or data.get("htmlLink")
        except HTTPError as exc:
            details = ""
            if exc.fp:
                try:
                    details = exc.fp.read().decode("utf-8").strip()
                except Exception:
                    details = ""
            raise ValueError(f"Google Meet creation failed ({exc.code} {exc.reason}){': ' + details if details else ''}") from exc
        except (URLError, TimeoutError) as exc:
            raise ValueError(f"Google Meet creation failed: {exc}") from exc
