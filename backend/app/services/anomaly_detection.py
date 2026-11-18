"""Runtime scoring for campus QR verification activity."""
from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from math import log1p
from pathlib import Path
from zoneinfo import ZoneInfo

import joblib
import pandas as pd
from sqlalchemy.orm import Session

from app.models.anomalyalert import AnomalyAlert
from app.models.verificationlog import VerificationLog

ROOT = Path(__file__).resolve().parents[3]
DATASET = ROOT / "ml" / "qr_verification_dataset.csv"
ARTIFACT = ROOT / "ml" / "artifacts" / "isolation_forest_qr.joblib"
FEATURE_COLUMNS = [
    "hour_of_day", "is_outside_operating_hours", "log_time_since_last_scan",
    "spatial_order_diff", "impossible_travel_flag", "rapid_same_building_repeat",
    "scans_last_10min", "scans_last_1hr", "failed_scans_last_10min", "result_encoded",
]
TOPOLOGY = {
    "Central Building": 0, "University Library": 1, "Auditorium": 2,
    "Oval Building": 3, "Management Science Building (MSB)": 5,
    "St Thomas Moore Building (STMB)": 4, "STMB": 4, "MSB": 5, "Forge": 6,
}


def _load_model():
    if ARTIFACT.exists():
        bundle = joblib.load(ARTIFACT)
        return bundle["model"], bundle.get("feature_columns", FEATURE_COLUMNS), bundle.get("campus_topology", TOPOLOGY)
    if not DATASET.exists():
        return None
    # Train once per backend process using the notebook's split and parameters.
    from sklearn.ensemble import IsolationForest
    from sklearn.model_selection import train_test_split
    data = pd.read_csv(DATASET)
    labels = data["is_anomaly"].astype(int)
    X_train, _, y_train, _ = train_test_split(
        data[FEATURE_COLUMNS], labels,
        test_size=0.20, stratify=labels, random_state=42,
    )
    model = IsolationForest(
        n_estimators=200, max_samples=256, max_features=0.7,
        contamination=float(y_train.mean()), random_state=42, n_jobs=-1,
    ).fit(X_train)
    return model, FEATURE_COLUMNS, TOPOLOGY


@lru_cache(maxsize=1)
def get_model():
    try:
        return _load_model()
    except (ImportError, OSError, ValueError, KeyError):
        return None


def _features(db: Session, log: VerificationLog) -> dict[str, float | str]:
    now = log.scanned_at or datetime.now(timezone.utc)
    local_now = now.astimezone(ZoneInfo("Africa/Nairobi"))
    location = (log.location or "").strip()
    prior_query = db.query(VerificationLog).filter(VerificationLog.scanned_at < now)
    if log.subject_school_id is not None:
        prior_query = prior_query.filter(VerificationLog.subject_school_id == log.subject_school_id)
    else:
        prior_query = prior_query.filter(VerificationLog.verified_by == log.verified_by, VerificationLog.subject_school_id.is_(None))
    prior = prior_query.order_by(VerificationLog.scanned_at.desc()).limit(60).all()
    age_seconds = max(0.0, (now - prior[0].scanned_at).total_seconds()) if prior else 86400.0
    ten_min = [r for r in prior if (now - r.scanned_at).total_seconds() <= 600]
    hour = [r for r in prior if (now - r.scanned_at).total_seconds() <= 3600]
    previous_location = (prior[0].location or "").strip() if prior else location
    order = TOPOLOGY
    prev_order = order.get(previous_location, 0)
    current_order = order.get(location, 0)
    delta = abs(current_order - prev_order)
    travel_impossible = int(bool(prior and previous_location != location and delta >= 4 and age_seconds < 300))
    return {
        "hour_of_day": local_now.hour + local_now.minute / 60 + local_now.second / 3600,
        "is_outside_operating_hours": int(local_now.hour < 7 or local_now.hour >= 21),
        "log_time_since_last_scan": log1p(min(age_seconds, 86400)),
        "spatial_order_diff": float(delta),
        "impossible_travel_flag": travel_impossible,
        "rapid_same_building_repeat": int(bool(prior and previous_location == location and age_seconds < 30)),
        "scans_last_10min": float(len(ten_min) + 1),
        "scans_last_1hr": float(len(hour) + 1),
        "failed_scans_last_10min": float(sum(r.outcome != "verified" for r in ten_min) + (log.outcome != "verified")),
        "result_encoded": float(log.outcome == "verified"),
        "previous_location": previous_location,
        "current_location": location,
        "seconds_since_last_scan": age_seconds,
    }


def _outside_access_hours(log: VerificationLog) -> bool:
    scanned_at = log.scanned_at or datetime.now(timezone.utc)
    if scanned_at.tzinfo is None:
        scanned_at = scanned_at.replace(tzinfo=timezone.utc)
    local_time = scanned_at.astimezone(ZoneInfo("Africa/Nairobi"))
    return local_time.hour < 7 or local_time.hour >= 21


def _reason_for(values: dict[str, float | str]) -> str:
    flags = []
    if values["is_outside_operating_hours"]:
        flags.append("Outside access hours")
    if values["impossible_travel_flag"]:
        minutes = max(1, round(float(values["seconds_since_last_scan"]) / 60))
        flags.append(f"Scanned at {values['current_location']} {minutes} min after {values['previous_location']}")
    elif values["spatial_order_diff"] > 0 and values["seconds_since_last_scan"] <= 8 * 60:
        minutes = max(1, round(float(values["seconds_since_last_scan"]) / 60))
        flags.append(f"Building changed from {values['previous_location']} to {values['current_location']} in {minutes} min")
    if values["rapid_same_building_repeat"]:
        flags.append(f"Repeated scan at {values['current_location']} within 30 seconds")
    if values["failed_scans_last_10min"] >= 3:
        count = int(values["failed_scans_last_10min"])
        flags.append(f"{count} failed attempts within 10 minutes")
    return "; ".join(flags)


def _add_alert(db: Session, log: VerificationLog, severity: str, reason: str) -> None:
    db.add(AnomalyAlert(
        student_id=log.student_id,
        verification_log_id=log.id,
        severity=severity,
        description=reason,
        status="open",
    ))


def score_verification(db: Session, log: VerificationLog) -> dict | None:
    if log.outcome == "verified" and _outside_access_hours(log):
        reason = "Outside access hours"
        _add_alert(db, log, "high", reason)
        return {"is_anomaly": True, "severity": "high", "description": reason}

    values = _features(db, log)
    hard_risk = log.outcome == "verified" and (
        values["impossible_travel_flag"] or values["failed_scans_last_10min"] >= 3
    )
    if hard_risk:
        reason = _reason_for(values)
        _add_alert(db, log, "high", reason)
        return {"is_anomaly": True, "severity": "high", "description": reason}

    loaded = get_model()
    if loaded is None:
        return None
    model, columns, _ = loaded
    row = pd.DataFrame([[values.get(name, 0.0) for name in columns]], columns=columns)
    prediction = int(model.predict(row)[0] == -1)
    if not prediction:
        return {"is_anomaly": False}
    # The model is a candidate detector; require a concrete supporting signal
    # before raising an alert for a scan pattern that can be normal on campus.
    reason = _reason_for(values)
    if not reason:
        return {"is_anomaly": False}
    severity = "high" if values["impossible_travel_flag"] or values["failed_scans_last_10min"] >= 3 else "medium"
    _add_alert(db, log, severity, reason)
    return {"is_anomaly": True, "severity": severity, "description": reason}
