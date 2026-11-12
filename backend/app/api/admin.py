from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.staff import AdminAccountCreate, AdminAccountResponse, PendingStudentResponse, StudentRejection

router = APIRouter()


@router.post("/users", response_model=AdminAccountResponse, status_code=status.HTTP_201_CREATED)
def create_staff_or_admin(
    data: AdminAccountCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    if db.get(User, data.school_id):
        raise HTTPException(status_code=409, detail="This School ID is already registered")
    user = User(
        school_id=data.school_id,
        first_name=data.first_name.strip(),
        last_name=data.last_name.strip(),
        full_name=f"{data.first_name.strip()} {data.last_name.strip()}",
        gender=data.gender,
        phone_number=data.phone_number.strip() if data.phone_number else None,
        email=str(data.email).strip().lower(),
        password_hash=hash_password(data.password),
        role=data.role,
        work_role=data.work_role,
        head_school=data.head_school,
        is_active=True,
    )
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="This School ID is already registered")
    return user


@router.get("/students/pending", response_model=list[PendingStudentResponse])
def pending_students(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    rows = (
        db.query(Student, User)
        .join(User, User.school_id == Student.user_id)
        .filter(Student.approval_status == "pending")
        .order_by(Student.created_at.asc())
        .all()
    )
    return [
        PendingStudentResponse(
            school_id=user.school_id,
            first_name=user.first_name,
            last_name=user.last_name,
            full_name=user.full_name,
            email=user.email,
            phone_number=user.phone_number,
            gender=user.gender,
            school=student.school,
            degree=student.degree,
            year_of_study=student.year_of_study,
            group_name=student.group_name,
            approval_status=student.approval_status,
            rejection_reason=student.rejection_reason,
        )
        for student, user in rows
    ]


@router.post("/students/{school_id}/approve")
def approve_student(
    school_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    student = db.query(Student).filter(Student.user_id == school_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student registration not found")
    student.approval_status = "approved"
    student.rejection_reason = None
    student.approved_at = datetime.now(timezone.utc)
    student.approved_by = admin.school_id
    db.commit()
    return {"school_id": school_id, "approval_status": "approved"}


@router.post("/students/{school_id}/reject")
def reject_student(
    school_id: int,
    data: StudentRejection,
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    student = db.query(Student).filter(Student.user_id == school_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student registration not found")
    student.approval_status = "rejected"
    student.rejection_reason = data.reason.strip()
    student.approved_at = None
    student.approved_by = admin.school_id
    db.commit()
    return {"school_id": school_id, "approval_status": "rejected"}
