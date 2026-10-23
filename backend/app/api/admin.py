from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.staff import StaffCreate, StaffResponse

router = APIRouter()


@router.post(
    "/staff",
    response_model=StaffResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_staff(
    data: StaffCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    email = str(data.email).strip().lower()

    existing_user = (
        db.query(User)
        .filter(func.lower(User.email) == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    staff = User(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role="staff",
        is_active=True,
    )

    try:
        db.add(staff)
        db.commit()
        db.refresh(staff)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    return staff