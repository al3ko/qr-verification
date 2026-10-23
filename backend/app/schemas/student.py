from pydantic import BaseModel


class StudentProfileResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    role: str
    registration_number: str
    course: str
    department: str | None = None
    year_of_study: int | None = None