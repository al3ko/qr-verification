from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    school_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(75), nullable=False)
    last_name: Mapped[str] = mapped_column(String(75), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    gender: Mapped[str | None] = mapped_column(String(30), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(30), nullable=True)
    photo_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="student", nullable=False)
    work_role: Mapped[str | None] = mapped_column(String(40), nullable=True)
    head_school: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    student_profile = relationship("Student", back_populates="user", uselist=False, foreign_keys="Student.user_id")
