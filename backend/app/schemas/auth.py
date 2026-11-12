from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field, model_validator

SCHOOL_DEGREES = {
    "School of Computing and Engineering Sciences (SCES)": [
        "Bachelor of Science in Informatics and Computer Science (BICS)",
        "Bachelor of Business Information Technology (BBIT)",
        "Bachelor of Science in Computer Networks and Cyber Security (BNCS)",
        "Bachelor of Science in Electrical and Electronics Engineering (BEEE)",
    ],
    "Strathmore Business School (SBS)": [
        "Bachelor of Commerce (BCOM)",
        "Bachelor of Financial Services (BFS)",
    ],
    "Strathmore Law School (SLS)": [
        "Bachelor of Laws (LLB)",
        "Bachelor of Science in Supply Chain and Operations Management (BSc SC&OM)",
    ],
    "School of Humanities and Social Sciences (SHSS)": [
        "Bachelor of Arts in Communication",
        "Bachelor of Arts in International Studies",
        "Bachelor of Arts in Development Studies and Philosophy",
    ],
    "Strathmore Institute of Mathematical Sciences (SIMS)": [
        "Bachelor of Business Science in Actuarial Science (BBS Actuarial Science)",
        "Bachelor of Business Science in Financial Economics (BBS FE)",
        "Bachelor of Business Science in Financial Engineering (BBS FinEng)",
        "Bachelor of Science in Statistics and Data Science (BSc SDS)",
    ],
}
GENDERS = ("Female", "Male", "Other", "Prefer not to say")
STAFF_ROLES = ("Security Staff", "Lecturer", "Cleaning Staff", "Cooking Staff", "Invigilator")
SCHOOL_CODES = ("SCES", "SBS", "SLS", "SHSS", "SIMS")
PhotoData = Annotated[str, Field(max_length=4_200_000, pattern=r"^data:image/(jpeg|png|webp);base64,")]


class StudentRegister(BaseModel):
    school_id: int = Field(ge=100000, le=500000)
    first_name: str = Field(min_length=1, max_length=75)
    last_name: str = Field(min_length=1, max_length=75)
    gender: Literal["Female", "Male", "Other", "Prefer not to say"]
    phone_number: str | None = Field(default=None, max_length=30)
    school: str
    degree: str
    year_of_study: int = Field(ge=1, le=6)
    group_name: str = Field(min_length=1, max_length=80)
    photo_data: PhotoData
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_registration(self):
        if self.degree not in SCHOOL_DEGREES.get(self.school, []):
            raise ValueError("Choose a degree offered by the selected school")
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class LoginRequest(BaseModel):
    school_id: int = Field(ge=100, le=500000)
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    school_id: int
    first_name: str
    last_name: str
    full_name: str
    email: EmailStr
    role: str
    work_role: str | None = None
    is_active: bool

    model_config = {"from_attributes": True}


class StudentRegisterResponse(UserResponse):
    approval_status: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
