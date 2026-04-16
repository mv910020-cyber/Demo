from datetime import datetime, timedelta

from app.core.datetime_utils import utcnow_naive
from app.api.dashboard import get_dead_letter_reminders
from app.models.demo import Demo
from app.models.enums import DemoStatus, DemoType, ReminderChannel, ReminderStatus, Role
from app.models.reminder import DemoReminder
from app.models.user import User


def test_dead_letter_report_returns_failed_items(db_session):
    manager = User(full_name="Manager", email="manager@example.com", password_hash="x", role=Role.MANAGEMENT)
    demo = Demo(
        product_interest="FastTrade99",
        company_name="Omega Corp",
        contact_name="Olivia",
        contact_email="olivia@example.com",
        demo_type=DemoType.ONLINE,
        status=DemoStatus.SCHEDULED,
        final_datetime=utcnow_naive() + timedelta(hours=3),
    )
    db_session.add_all([manager, demo])
    db_session.commit()
    db_session.refresh(manager)
    db_session.refresh(demo)

    failed = DemoReminder(
        demo_id=demo.id,
        channel=ReminderChannel.EMAIL,
        remind_at=utcnow_naive() - timedelta(hours=1),
        attempt_count=3,
        max_attempts=3,
        status=ReminderStatus.FAILED,
        failure_reason="smtp timeout",
    )
    db_session.add(failed)
    db_session.commit()

    report = get_dead_letter_reminders(limit=20, _=manager, db=db_session)

    assert report.total_failed_reminders == 1
    assert len(report.items) == 1
    assert report.items[0].company_name == "Omega Corp"
    assert report.items[0].failure_reason == "smtp timeout"
