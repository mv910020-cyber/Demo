from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.demo import Demo
from app.models.enums import Role
from app.models.reminder import DemoReminder
from app.models.user import User
from app.schemas.reminder import ReminderCreate, ReminderRead

router = APIRouter(prefix="/demos/{demo_id}/reminders", tags=["reminders"])


@router.post("/", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(
    demo_id: int,
    payload: ReminderCreate,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> DemoReminder:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    reminder = DemoReminder(demo_id=demo_id, **payload.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.get("/", response_model=list[ReminderRead])
def list_reminders(
    demo_id: int,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL, Role.MANAGEMENT})),
    db: Session = Depends(get_db),
) -> list[DemoReminder]:
    return db.query(DemoReminder).filter(DemoReminder.demo_id == demo_id).order_by(DemoReminder.remind_at.asc()).all()
