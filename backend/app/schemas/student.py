from pydantic import BaseModel


class StudentProfileResponse(BaseModel):
    school_id: int
    first_name: str
    last_name: str
    full_name: str
    email: str
    gender: str | None = None
    phone_number: str | None = None
    photo_data: str | None = None
    role: str
    school: str | None = None
    degree: str | None = None
    group_name: str | None = None
    registration_number: str
    course: str
    year_of_study: int | None = None
    approval_status: str
    rejection_reason: str | None = None
