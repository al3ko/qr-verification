from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Student(Base):
    __tablename__ = "students"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.school_id", ondelete="CASCADE"), unique=True, nullable=False
    )
    registration_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    course: Mapped[str] = mapped_column(String(150), nullable=False)
    department: Mapped[str | None] = mapped_column(String(150), nullable=True)
    year_of_study: Mapped[int | None] = mapped_column(Integer, nullable=True)
    school: Mapped[str | None] = mapped_column(String(120), nullable=True)
    degree: Mapped[str | None] = mapped_column(String(160), nullable=True)
    group_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    approval_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    approved_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.school_id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    user = relationship("User", back_populates="student_profile", foreign_keys=[user_id])
