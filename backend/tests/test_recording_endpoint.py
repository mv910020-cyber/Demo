from datetime import datetime

from app.core.datetime_utils import utcnow_naive
from app.api.demos import update_recording
from app.models.demo import Demo
from app.models.enums import DemoStatus, DemoType, Role
from app.models.user import User
from app.schemas.demo import DemoRecordingUpdate


def test_update_recording_sets_metadata(db_session):
    user = User(full_name="Rep", email="rep@example.com", password_hash="x", role=Role.SALES)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    demo = Demo(
        product_interest="FastTrade99",
        company_name="Delta",
        contact_name="Dina",
        contact_email="dina@example.com",
        demo_type=DemoType.ONLINE,
        status=DemoStatus.COMPLETED,
    )
    db_session.add(demo)
    db_session.commit()
    db_session.refresh(demo)

    payload = DemoRecordingUpdate(recording_url="https://recordings.example/demo.mp4", recording_notes="Client agreed")
    updated = update_recording(demo.id, payload, _=user, db=db_session)

    assert updated.recording_url == "https://recordings.example/demo.mp4"
    assert updated.recording_notes == "Client agreed"
    assert updated.recording_uploaded_at is not None
    assert updated.recording_uploaded_at <= utcnow_naive()
