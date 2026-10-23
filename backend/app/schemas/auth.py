
from pydantic import BaseModel, Field


class StudentRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: str = Field(
        min_length=5,
        max_length=255,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    password: str = Field(min_length=8, max_length=128)
    registration_number: str = Field(min_length=1, max_length=50)
    course: str = Field(min_length=1, max_length=150)
    department: str | None = Field(default=None, max_length=150)
    year_of_study: int | None = Field(default=None, ge=1, le=10)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}


class StudentRegisterResponse(UserResponse):
    student_id: int
    registration_number: str
    course: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
