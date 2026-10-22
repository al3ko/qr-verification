
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    student_id: Mapped[int | None] = mapped_column(
        ForeignKey("students.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    qr_code_id: Mapped[int | None] = mapped_column(
        ForeignKey("qr_codes.id", ondelete="SET NULL"),
        nullable=True,
    )

    verified_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    outcome: Mapped[str] = mapped_column(
        String(30), nullable=False
    )

    location: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )

    details: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    scanned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )
