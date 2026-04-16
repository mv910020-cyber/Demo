from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.availability import UserAvailability
from app.models.enums import Role
from app.models.user import User
from app.schemas.availability import AvailabilityCreate, AvailabilityRead

router = APIRouter(prefix="/users/{user_id}/availability", tags=["availability"])


@router.post("/", response_model=AvailabilityRead, status_code=status.HTTP_201_CREATED)
def create_availability(
    user_id: int,
    payload: AvailabilityCreate,
    _: User = Depends(require_roles({Role.ADMIN, Role.MANAGEMENT})),
    db: Session = Depends(get_db),
) -> UserAvailability:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    availability = UserAvailability(user_id=user_id, **payload.model_dump())
    db.add(availability)
    db.commit()
    db.refresh(availability)
    return availability


@router.get("/", response_model=list[AvailabilityRead])
def list_availability(
    user_id: int,
    _: User = Depends(require_roles({Role.ADMIN, Role.MANAGEMENT, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> list[UserAvailability]:
    return db.query(UserAvailability).filter(UserAvailability.user_id == user_id).all()
