from datetime import datetime, timedelta
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings
from app.services.meetings.base import MeetingAdapter


class TeamsAdapter(MeetingAdapter):
    def create_meeting(self, title: str, start_time: datetime, duration_minutes: int, attendees: list[str]) -> str:
        if not settings.microsoft_graph_access_token:
            raise ValueError("Microsoft Graph access token is required")

        end_time = start_time + timedelta(minutes=duration_minutes)
        payload = {
            "subject": title,
            "startDateTime": start_time.isoformat(),
            "endDateTime": end_time.isoformat(),
            "attendees": [{"emailAddress": {"address": email}, "type": "required"} for email in attendees],
        }
        request = Request(
            "https://graph.microsoft.com/v1.0/me/events",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {settings.microsoft_graph_access_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
            join_url = data.get("onlineMeeting", {}).get("joinUrl")
            if join_url:
                return join_url
            return data.get("webLink")
        except HTTPError as exc:
            details = ""
            if exc.fp:
                try:
                    details = exc.fp.read().decode("utf-8").strip()
                except Exception:
                    details = ""
            raise ValueError(f"Teams meeting creation failed ({exc.code} {exc.reason}){': ' + details if details else ''}") from exc
        except (URLError, TimeoutError) as exc:
            raise ValueError(f"Teams meeting creation failed: {exc}") from exc
