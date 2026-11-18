from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import timedelta

from sqlalchemy import case, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import require_roles
from app.core.security import hash_password
from app.db.session import get_db
from app.models.anomalyalert import AnomalyAlert
from app.models.student import Student
from app.models.user import User
from app.models.verificationlog import VerificationLog
from app.schemas.staff import AdminAccountCreate, AdminAccountResponse, PendingStudentResponse, StudentRejection

router = APIRouter()


@router.get("/access-analytics")
def access_analytics(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    """Return summarized access activity and recent records to administrators."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    base = db.query(VerificationLog).filter(VerificationLog.scanned_at >= since)

    totals = (
        db.query(
            func.count(VerificationLog.id).label("scans"),
            func.sum(case((VerificationLog.outcome == "verified", 1), else_=0)).label("verified"),
            func.count(func.distinct(VerificationLog.subject_school_id)).label("people"),
            func.count(func.distinct(func.lower(func.trim(VerificationLog.location)))).label("buildings"),
            func.count(func.distinct(case((User.role == "student", User.school_id)))).label("students"),
            func.count(func.distinct(case((User.role == "staff", User.school_id)))).label("staff"),
        )
        .select_from(VerificationLog)
        .outerjoin(User, User.school_id == VerificationLog.subject_school_id)
        .filter(VerificationLog.scanned_at >= since)
        .one()
    )

    building_rows = (
        base.with_entities(
            func.min(VerificationLog.location).label("building"),
            VerificationLog.phase.label("phase"),
            func.count(VerificationLog.id).label("scans"),
            func.sum(case((VerificationLog.outcome == "verified", 1), else_=0)).label("verified"),
            func.count(func.distinct(VerificationLog.subject_school_id)).label("people"),
        )
        .group_by(func.lower(func.trim(VerificationLog.location)), VerificationLog.phase)
        .order_by(func.count(VerificationLog.id).desc())
        .all()
    )

    people_rows = (
        db.query(
            User.role.label("role"), User.school_id.label("school_id"),
            User.full_name.label("name"), User.work_role.label("work_role"),
            Student.school.label("school"), Student.registration_number.label("registration_number"),
            func.count(VerificationLog.id).label("scans"),
            func.sum(case((VerificationLog.outcome == "verified", 1), else_=0)).label("verified"),
            func.max(VerificationLog.scanned_at).label("last_seen"),
        )
        .select_from(VerificationLog)
        .join(User, User.school_id == VerificationLog.subject_school_id)
        .outerjoin(Student, Student.user_id == User.school_id)
        .filter(VerificationLog.scanned_at >= since, User.role.in_(("student", "staff")))
        .group_by(User.role, User.school_id, User.full_name, User.work_role, Student.school, Student.registration_number)
        .order_by(func.count(VerificationLog.id).desc())
        .all()
    )
    people = [{
        "role": row.role, "school_id": row.school_id, "name": row.name,
        "work_role": row.work_role, "school": row.school,
        "registration_number": row.registration_number, "scans": row.scans,
        "verified": row.verified or 0,
        "last_seen": row.last_seen.isoformat() if row.last_seen else None,
    } for row in people_rows]

    recent_rows = (
        db.query(VerificationLog, User)
        .outerjoin(User, User.school_id == VerificationLog.subject_school_id)
        .filter(VerificationLog.scanned_at >= since)
        .order_by(VerificationLog.scanned_at.desc())
        .limit(100)
        .all()
    )
    recent = [{
        "id": log.id, "school_id": log.subject_school_id,
        "name": user.full_name if user else "Removed account",
        "role": user.role if user else "unknown",
        "work_role": user.work_role if user else None,
        "phase": log.phase, "building": log.location,
        "outcome": log.outcome, "scanned_at": log.scanned_at.isoformat(),
    } for log, user in recent_rows]

    scan_count = totals.scans or 0
    return {
        "period_days": days,
        "summary": {
            "total_scans": scan_count,
            "verified_entries": totals.verified or 0,
            "unique_people": totals.people or 0,
            "unique_students": totals.students or 0,
            "unique_staff": totals.staff or 0,
            "active_buildings": totals.buildings or 0,
            "average_scans_per_person": round(scan_count / totals.people, 1) if totals.people else 0,
        },
        "buildings": [{
            "building": row.building or "Unknown building", "phase": row.phase,
            "scans": row.scans, "verified": row.verified or 0, "people": row.people,
        } for row in building_rows],
        "students": [row for row in people if row["role"] == "student"],
        "staff": [row for row in people if row["role"] == "staff"],
        "recent": recent,
    }


@router.get("/anomaly-alerts")
def anomaly_alerts(
    db: Session = Depends(get_db),
    admin: User = Depends(require_roles("admin")),
):
    """Return recent model generated anomaly alerts for administrator review."""
    rows = (
        db.query(AnomalyAlert, VerificationLog, User)
        .outerjoin(VerificationLog, VerificationLog.id == AnomalyAlert.verification_log_id)
        .outerjoin(User, User.school_id == VerificationLog.subject_school_id)
        .order_by(AnomalyAlert.detected_at.desc())
        .limit(200)
        .all()
    )
    return [{
        "id": alert.id, "severity": alert.severity, "description": _concise_anomaly_reason(alert.description),
        "status": alert.status, "detected_at": alert.detected_at.isoformat(),
        "school_id": log.subject_school_id if log else None,
        "name": user.full_name if user else "Unknown account",
        "phase": log.phase if log else None, "building": log.location if log else None,
        "outcome": log.outcome if log else None,
        "scanned_at": log.scanned_at.isoformat() if log and log.scanned_at else None,
    } for alert, log, user in rows]


def _concise_anomaly_reason(description: str) -> str:
    """Remove the model and score prefix from alerts created by older versions."""
    prefix = "): "
    if description.startswith("Isolation Forest flagged this verification (") and prefix in description:
        description = description.split(prefix, 1)[1]
    description = description.strip().rstrip(".")
    return description or "Unusual access pattern"


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
