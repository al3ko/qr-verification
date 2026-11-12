from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_approved_student, require_roles
from app.db.session import get_db
from app.models.qrcode import QRCode as QRCodeRecord
from app.models.student import Student
from app.models.user import User
from app.models.verificationlog import VerificationLog
from app.schemas.qr import QRCodeResponse
from app.schemas.student import StudentProfileResponse
from app.services.qr_service import generate_qr_image, generate_qr_token, get_qr_expiry, hash_qr_token

router = APIRouter()


@router.get("/me", response_model=StudentProfileResponse)
def get_student_profile(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.school_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    return StudentProfileResponse(school_id=current_user.school_id, first_name=current_user.first_name, last_name=current_user.last_name,
        full_name=current_user.full_name, email=current_user.email, gender=current_user.gender, phone_number=current_user.phone_number,
        photo_data=current_user.photo_data, role=current_user.role, school=student.school, degree=student.degree or student.course,
        group_name=student.group_name, registration_number=student.registration_number, course=student.degree or student.course,
        year_of_study=student.year_of_study, approval_status=student.approval_status, rejection_reason=student.rejection_reason)


@router.post("/qr-code", response_model=QRCodeResponse)
def create_student_qr(current_user: User = Depends(require_approved_student), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.school_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")
    db.query(QRCodeRecord).filter(QRCodeRecord.student_id == student.id, QRCodeRecord.is_revoked.is_(False)).update({"is_revoked": True}, synchronize_session=False)
    token, expiry = generate_qr_token(), get_qr_expiry()
    record = QRCodeRecord(student_id=student.id, token_hash=hash_qr_token(token), expires_at=expiry, is_revoked=False)
    db.add(record)
    db.commit()
    db.refresh(record)
    return QRCodeResponse(qr_code_id=record.id, qr_token=token, qr_image=generate_qr_image(token), expires_at=expiry, message="QR credential generated successfully")


@router.get("/history")
def student_access_history(current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    rows = db.query(VerificationLog).filter(VerificationLog.subject_school_id == current_user.school_id).order_by(VerificationLog.scanned_at.desc()).limit(200).all()
    return [{"school_id": row.subject_school_id, "phase": row.phase, "location": row.location, "outcome": row.outcome, "scanned_at": row.scanned_at} for row in rows]


@router.get("/latest-verification")
def latest_verification(after: datetime, current_user: User = Depends(require_roles("student")), db: Session = Depends(get_db)):
    if after.tzinfo is None:
        after = after.replace(tzinfo=timezone.utc)
    log = (db.query(VerificationLog)
        .filter(VerificationLog.subject_school_id == current_user.school_id,
                VerificationLog.outcome == "verified",
                VerificationLog.scanned_at >= after)
        .order_by(VerificationLog.scanned_at.desc())
        .first())
    if log is None:
        return None
    student = db.query(Student).filter(Student.user_id == current_user.school_id).first()
    return {
        "id": log.id,
        "verified": True,
        "outcome": log.outcome,
        "message": "Student identity verified successfully.",
        "student_name": current_user.full_name,
        "registration_number": student.registration_number if student else None,
        "school_id": current_user.school_id,
        "course": (student.degree or student.course) if student else None,
        "year_of_study": student.year_of_study if student else None,
        "photo_data": current_user.photo_data,
        "subject_role": "student",
        "phase": log.phase,
        "location": log.location,
        "scanned_at": log.scanned_at.isoformat(),
    }