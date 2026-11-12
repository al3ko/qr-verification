import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.auth import LoginRequest, StudentRegister, StudentRegisterResponse, TokenResponse, UserResponse

router = APIRouter()


def email_for_student(first_name: str, last_name: str) -> str:
    def clean(value: str) -> str:
        value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
        return re.sub(r"[^a-z0-9]+", ".", value.lower()).strip(".")
    return f"{clean(first_name)}.{clean(last_name)}@strathmore.edu"


@router.post("/register", response_model=StudentRegisterResponse, status_code=status.HTTP_201_CREATED)
def register_student(data: StudentRegister, db: Session = Depends(get_db)):
    if db.get(User, data.school_id):
        raise HTTPException(status_code=409, detail="This School ID is already registered")

    first_name, last_name = data.first_name.strip(), data.last_name.strip()
    email = email_for_student(first_name, last_name)
    user = User(
        school_id=data.school_id,
        first_name=first_name,
        last_name=last_name,
        full_name=f"{first_name} {last_name}",
        gender=data.gender,
        phone_number=data.phone_number.strip() if data.phone_number else None,
        photo_data=data.photo_data,
        email=email,
        password_hash=hash_password(data.password),
        role="student",
        is_active=True,
    )
    student = Student(
        user_id=data.school_id,
        registration_number=str(data.school_id),
        course=data.degree,
        department=data.school,
        school=data.school,
        degree=data.degree,
        year_of_study=data.year_of_study,
        group_name=data.group_name.strip(),
        approval_status="pending",
    )
    try:
        db.add_all([user, student])
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This School ID is already registered")
    db.refresh(user)
    return StudentRegisterResponse(
        **UserResponse.model_validate(user).model_dump(),
        approval_status="pending",
    )


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.get(User, data.school_id)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect School ID or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive")
    return TokenResponse(
        access_token=create_access_token(user.school_id),
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_my_account(current_user: User = Depends(get_current_user)):
    return current_user
