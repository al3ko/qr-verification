from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.schemas.auth import SCHOOL_CODES, STAFF_ROLES


class AdminAccountCreate(BaseModel):
    school_id: int = Field(ge=100, le=99999)
    role: Literal["staff", "admin"]
    first_name: str = Field(min_length=1, max_length=75)
    last_name: str = Field(min_length=1, max_length=75)
    gender: Literal["Female", "Male", "Other", "Prefer not to say"]
    phone_number: str | None = Field(default=None, max_length=30)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    work_role: str | None = None
    head_school: str | None = None

    @model_validator(mode="after")
    def validate_role_data(self):
        if self.role == "staff":
            if self.work_role not in STAFF_ROLES:
                raise ValueError("Choose a valid staff role")
            if self.head_school:
                raise ValueError("Staff accounts cannot have a school head role")
            if self.work_role == "Lecturer":
                if not 50000 <= self.school_id <= 99999:
                    raise ValueError("Lecturer School IDs must be 50,000 to 99,999")
            elif not 1001 <= self.school_id <= 49999:
                raise ValueError("Other staff School IDs must be 1,001 to 49,999")
        else:
            if not 100 <= self.school_id <= 1000:
                raise ValueError("Admin School IDs must be 100 to 1,000")
            if self.head_school not in SCHOOL_CODES:
                raise ValueError("Choose a school for the administrator to head")
            if self.work_role:
                raise ValueError("Admin accounts cannot have a staff role")
        return self


class AdminAccountResponse(BaseModel):
    school_id: int
    first_name: str
    last_name: str
    full_name: str
    email: str
    role: str
    work_role: str | None = None
    head_school: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class PendingStudentResponse(BaseModel):
    school_id: int
    first_name: str
    last_name: str
    full_name: str
    email: str
    phone_number: str | None = None
    gender: str | None = None
    school: str | None = None
    degree: str | None = None
    year_of_study: int | None = None
    group_name: str | None = None
    approval_status: str
    rejection_reason: str | None = None


class StudentRejection(BaseModel):
    reason: str = Field(min_length=2, max_length=1000)
