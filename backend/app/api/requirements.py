from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.demo import Demo
from app.models.enums import Role
from app.models.requirement import Requirement
from app.models.user import User
from app.schemas.requirement import RequirementCreate, RequirementRead, RequirementUpdate

router = APIRouter(prefix="/demos/{demo_id}/requirements", tags=["requirements"])


@router.post("/", response_model=RequirementRead, status_code=status.HTTP_201_CREATED)
def create_requirement(
    demo_id: int,
    payload: RequirementCreate,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> Requirement:
    demo = db.query(Demo).filter(Demo.id == demo_id).first()
    if not demo:
        raise HTTPException(status_code=404, detail="Demo not found")

    requirement = Requirement(demo_id=demo_id, **payload.model_dump())
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement


@router.get("/", response_model=list[RequirementRead])
def list_requirements(
    demo_id: int,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL, Role.MANAGEMENT})),
    db: Session = Depends(get_db),
) -> list[Requirement]:
    return db.query(Requirement).filter(Requirement.demo_id == demo_id).all()


@router.patch("/{requirement_id}", response_model=RequirementRead)
def update_requirement(
    demo_id: int,
    requirement_id: int,
    payload: RequirementUpdate,
    _: User = Depends(require_roles({Role.ADMIN, Role.SALES, Role.TECHNICAL})),
    db: Session = Depends(get_db),
) -> Requirement:
    requirement = (
        db.query(Requirement)
        .filter(Requirement.id == requirement_id, Requirement.demo_id == demo_id)
        .first()
    )
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(requirement, field, value)

    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return requirement
