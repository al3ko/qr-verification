
from pydantic import BaseModel, Field, model_validator

BUILDINGS = {
    "Phase 1": ("Central Building",),
    "Phase 2": ("Management Science Building (MSB)", "St Thomas Moore Building (STMB)", "Forge", "Oval Building", "Auditorium", "University Library"),
}


class QRVerificationRequest(BaseModel):
    qr_token: str = Field(min_length=1)
    phase: str = Field(min_length=1, max_length=20)
    location: str = Field(min_length=1, max_length=255)

    @model_validator(mode="after")
    def valid_building(self):
        if self.location not in BUILDINGS.get(self.phase, ()):
            raise ValueError("Choose a building within the selected campus phase")
        return self


class QRVerificationResponse(BaseModel):
    verified: bool
    outcome: str
    message: str
    student_name: str | None = None
    registration_number: str | None = None
    course: str | None = None
    school_id: int | None = None
    year_of_study: int | None = None
    photo_data: str | None = None
    subject_role: str | None = None
    phase: str | None = None
    location: str | None = None
    scanned_at: str | None = None
