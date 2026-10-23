
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    StudentRegister,
    StudentRegisterResponse,
    TokenResponse,
    UserResponse,
)


router = APIRouter()


@router.post(
    "/register",
    response_model=StudentRegisterResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_student(
    data: StudentRegister,
    db: Session = Depends(get_db),
):
    email = data.email.strip().lower()
    registration_number = data.registration_number.strip()

    if not registration_number:
        raise HTTPException(
            status_code=422,
            detail="Registration number cannot be empty",
        )

    existing_email = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        )

    existing_registration = db.query(Student).filter(
        Student.registration_number == registration_number
    ).first()

    if existing_registration:
        raise HTTPException(
            status_code=409,
            detail="This registration number is already in use",
        )

    user = User(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role="student",
        is_active=True,
    )

    try:
        db.add(user)
        db.flush()

        student = Student(
            user_id=user.id,
            registration_number=registration_number,
            course=data.course.strip(),
            department=(
                data.department.strip()
                if data.department and data.department.strip()
                else None
            ),
            year_of_study=data.year_of_study,
        )

        db.add(student)
        db.commit()

        db.refresh(user)
        db.refresh(student)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="The email or registration number is already in use",
        )

    return StudentRegisterResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        is_active=user.is_active,
        student_id=student.id,
        registration_number=student.registration_number,
        course=student.course,
    )


@router.post("/login", response_model=TokenResponse)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    email = data.email.strip().lower()

    user = db.query(User).filter(
        func.lower(User.email) == email
    ).first()

    if (
        user is None
        or not verify_password(data.password, user.password_hash)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive",
        )

    token = create_access_token(user.id)

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_my_account(
    current_user: User = Depends(get_current_user),
):
    return current_user
