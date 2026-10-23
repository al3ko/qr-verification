from pydantic import BaseModel, Field, EmailStr


class StaffCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class StaffResponse(BaseModel):
    id: int
    full_name: str
    email: str
    role: str
    is_active: bool

    model_config = {"from_attributes": True}