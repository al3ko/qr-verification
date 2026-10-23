from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.qrcode import QRCode as QRCodeRecord
from app.schemas.qr import QRCodeResponse
from app.services.qr_service import (
    generate_qr_token,
    hash_qr_token,
    generate_qr_image,
    get_qr_expiry,
)

from app.api.deps import get_current_user, require_roles
from app.db.session import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentProfileResponse

router = APIRouter()


@router.get("/me", response_model=StudentProfileResponse)
def get_student_profile(
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    return StudentProfileResponse(
        user_id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=current_user.role,
        registration_number=student.registration_number,
        course=student.course,
        department=student.department,
        year_of_study=student.year_of_study,
    )

@router.post("/qr-code", response_model=QRCodeResponse)
def create_student_qr(
    current_user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .filter(Student.user_id == current_user.id)
        .first()
    )

    if student is None:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found",
        )

    # Revoke previous QR credentials for this student.
    db.query(QRCodeRecord).filter(
        QRCodeRecord.student_id == student.id,
        QRCodeRecord.is_revoked.is_(False),
    ).update(
        {"is_revoked": True},
        synchronize_session=False,
    )

    # Generate a new credential.
    token = generate_qr_token()
    expiry = get_qr_expiry()

    qr_record = QRCodeRecord(
        student_id=student.id,
        token_hash=hash_qr_token(token),
        expires_at=expiry,
        is_revoked=False,
    )

    db.add(qr_record)
    db.commit()
    db.refresh(qr_record)

    return QRCodeResponse(
        qr_code_id=qr_record.id,
        qr_token=token,
        qr_image=generate_qr_image(token),
        expires_at=expiry,
        message="QR credential generated successfully",
    )