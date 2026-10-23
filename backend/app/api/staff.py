
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.db.session import get_db
from app.models.qrcode import QRCode as QRCodeRecord
from app.models.student import Student
from app.models.user import User
from app.models.verificationlog import VerificationLog
from app.schemas.verification import (
    QRVerificationRequest,
    QRVerificationResponse,
)
from app.services.qr_service import hash_qr_token


router = APIRouter()


@router.post(
    "/verify-qr",
    response_model=QRVerificationResponse,
)
def verify_qr(
    request: QRVerificationRequest,
    current_user: User = Depends(require_roles("staff")),
    db: Session = Depends(get_db),
):
    token_hash = hash_qr_token(request.qr_token)

    qr_record = (
        db.query(QRCodeRecord)
        .filter(QRCodeRecord.token_hash == token_hash)
        .first()
    )

    student_id = None
    qr_code_id = None
    outcome = "invalid"
    message = "QR credential is invalid."
    student_name = None
    registration_number = None
    course = None

    if qr_record is not None:
        student_id = qr_record.student_id
        qr_code_id = qr_record.id

        if qr_record.is_revoked:
            outcome = "revoked"
            message = "QR credential has been revoked."

        elif qr_record.expires_at <= datetime.now(timezone.utc):
            outcome = "expired"
            message = "QR credential has expired."

        else:
            student = (
                db.query(Student)
                .filter(Student.id == qr_record.student_id)
                .first()
            )

            if student is None:
                outcome = "invalid"
                message = "Student record could not be found."
            else:
                student_user = (
                    db.query(User)
                    .filter(User.id == student.user_id)
                    .first()
                )

                if student_user is None or not student_user.is_active:
                    outcome = "invalid"
                    message = "Student account is unavailable."
                else:
                    outcome = "verified"
                    message = "Student identity verified successfully."
                    student_name = student_user.full_name
                    registration_number = student.registration_number
                    course = student.course

    log = VerificationLog(
        student_id=student_id,
        qr_code_id=qr_code_id,
        verified_by=current_user.id,
        outcome=outcome,
        location=request.location,
        details=message,
    )

    db.add(log)
    db.commit()

    return QRVerificationResponse(
        verified=(outcome == "verified"),
        outcome=outcome,
        message=message,
        student_name=student_name,
        registration_number=registration_number,
        course=course,
    )
