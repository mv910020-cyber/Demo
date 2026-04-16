from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException

from app.core.datetime_utils import utcnow_naive
from app.api.demos import schedule_demo
from app.models.demo import Demo
from app.models.enums import DemoStatus, DemoType, MeetingProvider, Role
from app.models.user import User
from app.schemas.demo import DemoSchedule
from app.services.meeting import MeetingService
from app.services.notification import NotificationService


def test_schedule_rejects_conflicting_manual_assignee(db_session, monkeypatch):
    sales = User(full_name="Sales One", email="sales@example.com", password_hash="x", role=Role.SALES)
    tech = User(full_name="Tech One", email="tech@example.com", password_hash="x", role=Role.TECHNICAL)
    db_session.add_all([sales, tech])
    db_session.commit()
    db_session.refresh(sales)
    db_session.refresh(tech)

    slot = utcnow_naive() + timedelta(days=1)

    existing = Demo(
        product_interest="FastTrade99",
        company_name="Acme",
        contact_name="Alice",
        contact_email="alice@example.com",
        demo_type=DemoType.ONLINE,
        status=DemoStatus.SCHEDULED,
        sales_rep_id=sales.id,
        technical_presenter_id=tech.id,
        final_datetime=slot,
    )
    pending = Demo(
        product_interest="FastSales99",
        company_name="Beta",
        contact_name="Bob",
        contact_email="bob@example.com",
        demo_type=DemoType.ONLINE,
        status=DemoStatus.NEW,
    )
    db_session.add_all([existing, pending])
    db_session.commit()
    db_session.refresh(pending)

    monkeypatch.setattr(MeetingService, "create_meeting_link", staticmethod(lambda **_: "https://meet.example/link"))
    monkeypatch.setattr(NotificationService, "send_schedule_notifications", staticmethod(lambda _: None))

    payload = DemoSchedule(
        sales_rep_id=sales.id,
        technical_presenter_id=tech.id,
        final_datetime=slot,
        meeting_provider=MeetingProvider.GOOGLE_MEET,
    )

    with pytest.raises(HTTPException) as exc:
        schedule_demo(pending.id, payload, _=sales, db=db_session)

    assert exc.value.status_code == 400
    assert "conflicting demo" in str(exc.value.detail)
