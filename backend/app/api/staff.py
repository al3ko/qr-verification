from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import update
from sqlalchemy.orm import Session

from app.api.deps import require_roles, require_security_guard
from app.db.session import get_db
from app.models.qrcode import QRCode as QRCodeRecord
from app.models.student import Student
from app.models.user import User
from app.models.verificationlog import VerificationLog
from app.schemas.qr import QRCodeResponse
from app.schemas.verification import QRVerificationRequest, QRVerificationResponse
from app.services.qr_service import generate_qr_image, generate_qr_token, get_qr_expiry, hash_qr_token
from app.services.anomaly_detection import score_verification

router = APIRouter()


def _new_qr(db: Session, user: User) -> QRCodeResponse:
    db.query(QRCodeRecord).filter(
        QRCodeRecord.staff_school_id == user.school_id,
        QRCodeRecord.is_revoked.is_(False),
    ).update({"is_revoked": True}, synchronize_session=False)
    token, expiry = generate_qr_token(), get_qr_expiry()
    record = QRCodeRecord(staff_school_id=user.school_id, token_hash=hash_qr_token(token), expires_at=expiry, is_revoked=False)
    db.add(record)
    db.commit()
    db.refresh(record)
    return QRCodeResponse(qr_code_id=record.id, qr_token=token, qr_image=generate_qr_image(token), expires_at=expiry, message="QR credential generated successfully")


@router.get("/me")
def get_staff_profile(current_user: User = Depends(require_roles("staff"))):
    return {"school_id": current_user.school_id, "first_name": current_user.first_name, "last_name": current_user.last_name,
            "full_name": current_user.full_name, "gender": current_user.gender, "phone_number": current_user.phone_number,
            "email": current_user.email, "role": current_user.role, "work_role": current_user.work_role}


@router.post("/qr-code", response_model=QRCodeResponse)
def create_staff_qr(current_user: User = Depends(require_roles("staff")), db: Session = Depends(get_db)):
    if current_user.work_role == "Security Staff":
        raise HTTPException(status_code=403, detail="Security Staff accounts verify QR credentials and cannot generate one")
    return _new_qr(db, current_user)


@router.get("/history")
def staff_access_history(current_user: User = Depends(require_roles("staff")), db: Session = Depends(get_db)):
    if current_user.work_role == "Security Staff":
        rows = db.query(VerificationLog).filter(VerificationLog.verified_by == current_user.school_id).order_by(VerificationLog.scanned_at.desc()).limit(200).all()
    else:
        rows = db.query(VerificationLog).filter(VerificationLog.subject_school_id == current_user.school_id).order_by(VerificationLog.scanned_at.desc()).limit(200).all()
    return [_history_row(row) for row in rows]


def _history_row(row: VerificationLog):
    return {"school_id": row.subject_school_id, "phase": row.phase, "location": row.location, "outcome": row.outcome, "scanned_at": row.scanned_at}


@router.post("/verify-qr", response_model=QRVerificationResponse)
def verify_qr(request: QRVerificationRequest, current_user: User = Depends(require_security_guard), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    qr = db.query(QRCodeRecord).filter(QRCodeRecord.token_hash == hash_qr_token(request.qr_token)).first()
    student = user = None
    subject_school_id = None
    student_id = None
    qr_code_id = qr.id if qr else None
    outcome, message = "invalid", "QR credential is invalid."

    if qr:
        student_id = qr.student_id
        subject_school_id = qr.staff_school_id
        if qr.student_id is not None:
            owner = db.query(Student).filter(Student.id == qr.student_id).first()
            subject_school_id = owner.user_id if owner else None
        if qr.expires_at is None or qr.expires_at <= now:
            outcome, message = "expired", "QR credential has expired. Generate a new QR code."
        elif qr.consumed_at is not None:
            outcome, message = "already_used", "This QR code has already been used. Generate a new QR code."
        elif qr.is_revoked:
            outcome, message = "revoked", "QR credential has been revoked. Generate a new QR code."
        else:
            claimed_id = db.execute(
                update(QRCodeRecord)
                .where(QRCodeRecord.id == qr.id, QRCodeRecord.is_revoked.is_(False),
                       QRCodeRecord.consumed_at.is_(None), QRCodeRecord.expires_at > now)
                .values(is_revoked=True, consumed_at=now)
                .returning(QRCodeRecord.id)
                .execution_options(synchronize_session=False)
            ).scalar_one_or_none()
            if claimed_id is None:
                db.refresh(qr)
                if qr.expires_at is None or qr.expires_at <= now:
                    outcome, message = "expired", "QR credential has expired. Generate a new QR code."
                elif qr.consumed_at is not None:
                    outcome, message = "already_used", "This QR code has already been used. Generate a new QR code."
                else:
                    outcome, message = "revoked", "QR credential has been revoked. Generate a new QR code."
            else:
                qr.is_revoked = True
                qr.consumed_at = now
                if qr.student_id is not None:
                    student = db.query(Student).filter(Student.id == qr.student_id).first()
                    user = db.get(User, student.user_id) if student else None
                    if user is None or not user.is_active:
                        outcome, message = "invalid", "Student account is unavailable."
                    elif student.approval_status != "approved":
                        outcome, message = "unapproved", "Student registration has not been approved."
                    else:
                        outcome, message = "verified", "Student identity verified successfully."
                else:
                    user = db.get(User, qr.staff_school_id)
                    if user is None or not user.is_active or user.role != "staff":
                        outcome, message = "invalid", "Staff account is unavailable."
                    else:
                        outcome, message = "verified", "Staff identity verified successfully."

    log = VerificationLog(student_id=student_id, subject_school_id=subject_school_id, qr_code_id=qr_code_id,
        verified_by=current_user.school_id, outcome=outcome, phase=request.phase, location=request.location, details=message)
    db.add(log)
    db.commit()
    db.refresh(log)
    anomaly = None
    accepted_outcome, accepted_message = outcome, message
    try:
        anomaly = score_verification(db, log)
        if anomaly and anomaly.get("is_anomaly"):
            if anomaly.get("severity") == "high" and outcome == "verified":
                outcome = "high_risk_anomaly"
                message = f"Denied: {anomaly['description']}."
                log.outcome = outcome
                log.details = message
            db.commit()
    except Exception:
        db.rollback()  # Anomaly scoring is advisory and must not block QR verification.
        anomaly = None
        outcome, message = accepted_outcome, accepted_message
    return QRVerificationResponse(verified=outcome == "verified", outcome=outcome, message=message,
        anomaly_detected=bool(anomaly and anomaly.get("is_anomaly")),
        student_name=user.full_name if outcome == "verified" and user else None, registration_number=student.registration_number if outcome == "verified" and student else None,
        course=(student.degree or student.course) if outcome == "verified" and student else None, school_id=user.school_id if outcome == "verified" and user else None,
        year_of_study=student.year_of_study if outcome == "verified" and student else None, photo_data=user.photo_data if outcome == "verified" and user else None,
        subject_role=("student" if student else (user.work_role if user else None)) if outcome == "verified" else None, phase=request.phase, location=request.location,
        scanned_at=log.scanned_at.isoformat() if log.scanned_at else None)
