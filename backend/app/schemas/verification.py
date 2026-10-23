
from pydantic import BaseModel, Field


class QRVerificationRequest(BaseModel):
    qr_token: str = Field(min_length=1)
    location: str | None = Field(default=None, max_length=255)


class QRVerificationResponse(BaseModel):
    verified: bool
    outcome: str
    message: str
    student_name: str | None = None
    registration_number: str | None = None
    course: str | None = None
