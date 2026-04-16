from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import datetime, timedelta
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_roles
from app.core.config import settings
from app.core.datetime_utils import ensure_naive_utc
from app.core.datetime_utils import utcnow_naive
from app.db.session import get_db
from app.models.demo import Demo
from app.models.enums import DemoStatus, ReminderChannel, Role
from app.models.reminder import DemoReminder
from app.models.user import User
from app.schemas.demo import (
    DemoCreate,
    DemoPostNotes,
    DemoRead,
    DemoRecordingUpdate,
    DemoSchedule,
    DemoSendInviteRequest,
    DemoSendInviteResponse,
    DemoStatusUpdate,
)
from app.services.assignment import AssignmentService
from app.services.demo_workflow import can_transition
from app.services.email_service import EmailService
from app.services.meeting import MeetingService
from app.services.message_templates import MessageTemplateService
from app.services.notification import NotificationService
from app.services.whatsapp_service import WhatsAppService

router = APIRouter(prefix="/demos", tags=["demos"])


@router.post("/", response_model=DemoRead, status_code=status.HTTP_201_CREATED)
def create_demo_request(payload: DemoCreate, db: Session = Depends(get_db)) -> Demo:
    demo = Demo(**payload.model_dump())
    db.add(demo)
    db.commit()
    db.refresh(demo)
    return demo


@router.get("/", response_model=list[DemoRead])
def list_demos(
    demo_status: DemoStatus | None = Query(default=None),
    product_interest: str | None = Query(default=None),
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL, Role.MANAGEMENT})),
    db: Session = Depends(get_db),
) -> list[Demo]:
    query = db.query(Demo).options(
        selectinload(Demo.action_items),
        selectinload(Demo.requirements),
        selectinload(Demo.reminders),
    )
    if demo_status:
        query = query.filter(Demo.status == demo_status)
    if product_interest:
        query = query.filter(Demo.product_interest == product_interest)
    return query.order_by(Demo.created_at.desc()).all()


@router.get("/{demo_id}", response_model=DemoRead)
def get_demo(
    demo_id: int,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL, Role.MANAGEMENT})),
    db: Session = Depends(get_db),
) -> Demo:
    demo = (
        db.query(Demo)
        .options(selectinload(Demo.action_items), selectinload(Demo.requirements), selectinload(Demo.reminders))
        .filter(Demo.id == demo_id)
        .first()
    )
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")
    return demo


@router.post("/{demo_id}/schedule", response_model=DemoRead)
def schedule_demo(
    demo_id: int,
    payload: DemoSchedule,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES})),
    db: Session = Depends(get_db),
) -> Demo:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    try:
        final_datetime = ensure_naive_utc(payload.final_datetime)
        sales_rep = (
            db.query(User).filter(User.id == payload.sales_rep_id).first()
            if payload.sales_rep_id is not None
            else AssignmentService.assign_available_rep(db, final_datetime)
        )
        technical = (
            db.query(User).filter(User.id == payload.technical_presenter_id).first()
            if payload.technical_presenter_id is not None
            else AssignmentService.assign_available_presenter(db, final_datetime)
        )
        if payload.sales_rep_id is not None and not sales_rep:
            raise HTTPException(status_code=400, detail="Invalid sales rep")
        if payload.technical_presenter_id is not None and not technical:
            raise HTTPException(status_code=400, detail="Invalid technical presenter")
        if sales_rep and AssignmentService.user_has_conflict(db, sales_rep, final_datetime):
            raise HTTPException(status_code=400, detail="Selected sales rep already has a conflicting demo")
        if technical and AssignmentService.user_has_conflict(db, technical, final_datetime):
            raise HTTPException(status_code=400, detail="Selected technical presenter already has a conflicting demo")

        demo.sales_rep_id = sales_rep.id
        demo.technical_presenter_id = technical.id
        demo.final_datetime = final_datetime
        demo.meeting_provider = payload.meeting_provider
        demo.meeting_link = MeetingService.create_meeting_link(
            provider=payload.meeting_provider,
            title=f"{demo.product_interest} demo for {demo.company_name}",
            start_time=final_datetime,
            duration_minutes=60,
            attendees=[demo.contact_email, sales_rep.email, technical.email],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    demo.status = DemoStatus.SCHEDULED

    db.add(demo)
    db.commit()
    db.refresh(demo)

    reminder_time = final_datetime - timedelta(minutes=30)
    if reminder_time > utcnow_naive():
        db.add(
            DemoReminder(
                demo_id=demo.id,
                channel=ReminderChannel.EMAIL,
                remind_at=reminder_time,
                max_attempts=settings.default_reminder_max_attempts,
            )
        )
        if demo.contact_phone:
            db.add(
                DemoReminder(
                    demo_id=demo.id,
                    channel=ReminderChannel.WHATSAPP,
                    remind_at=reminder_time,
                    max_attempts=settings.default_reminder_max_attempts,
                )
            )
        db.commit()

    return demo


@router.post("/{demo_id}/status", response_model=DemoRead)
def update_demo_status(
    demo_id: int,
    payload: DemoStatusUpdate,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> Demo:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    if not can_transition(demo.status, payload.status):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from {demo.status.value} to {payload.status.value}",
        )

    demo.status = payload.status
    if payload.status == DemoStatus.LOST:
        demo.lost_reason = payload.lost_reason
    elif payload.status == DemoStatus.CONVERTED:
        demo.lost_reason = None

    db.add(demo)
    db.commit()
    db.refresh(demo)

    NotificationService.send_status_notification(demo)
    return demo


@router.post("/{demo_id}/post-notes", response_model=DemoRead)
def add_post_demo_notes(
    demo_id: int,
    payload: DemoPostNotes,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> Demo:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(demo, field, value)

    if demo.status in {DemoStatus.CONFIRMED, DemoStatus.SCHEDULED} and can_transition(demo.status, DemoStatus.COMPLETED):
        demo.status = DemoStatus.COMPLETED

    db.add(demo)
    db.commit()
    db.refresh(demo)
    return demo


@router.patch("/{demo_id}/recording", response_model=DemoRead)
def update_recording(
    demo_id: int,
    payload: DemoRecordingUpdate,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> Demo:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    # Validate recording URL
    if payload.recording_url:
        if not payload.recording_url.startswith(("http://", "https://")):
            raise HTTPException(status_code=400, detail="Recording URL must start with http:// or https://")
        if len(payload.recording_url) > 500:
            raise HTTPException(status_code=400, detail="Recording URL is too long (max 500 characters)")

    demo.recording_url = payload.recording_url
    demo.recording_notes = payload.recording_notes
    demo.recording_uploaded_at = utcnow_naive()

    db.add(demo)
    db.commit()
    db.refresh(demo)
    return demo


@router.post("/{demo_id}/send-invite", response_model=DemoSendInviteResponse)
def send_demo_invite(
    demo_id: int,
    payload: DemoSendInviteRequest,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> DemoSendInviteResponse:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    if not demo.meeting_link:
        raise HTTPException(status_code=400, detail="Generate a meeting link before sending invites")

    if payload.channel == ReminderChannel.EMAIL:
        subject, body = MessageTemplateService.schedule_message(demo, ReminderChannel.EMAIL)
        sent = EmailService.send_email(demo.contact_email, subject, body)
        if not sent:
            raise HTTPException(status_code=500, detail="Unable to send email invite")
        return DemoSendInviteResponse(
            channel=ReminderChannel.EMAIL,
            sent=True,
            detail="Email invite sent successfully",
        )

    if not demo.contact_phone:
        raise HTTPException(status_code=400, detail="Contact phone is required for WhatsApp invite")

    _, body = MessageTemplateService.schedule_message(demo, ReminderChannel.WHATSAPP)
    sent = WhatsAppService.send_message(demo.contact_phone, body)
    if not sent:
        raise HTTPException(status_code=500, detail="Unable to send WhatsApp invite")

    return DemoSendInviteResponse(
        channel=ReminderChannel.WHATSAPP,
        sent=True,
        detail="WhatsApp invite sent successfully",
    )
