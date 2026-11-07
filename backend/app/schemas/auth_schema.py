from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from app.config.settings import settings

class UserRegisterRequest(BaseModel):
    college_email: str = Field(..., description="Institutional email e.g. student@dypcoeakurdi.ac.in")
    student_or_staff_id: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=6, max_length=128)
    role_id: int = Field(default=1, description="1: Student, 2: Administrator, 3: Maintenance_Staff")
    department_id: Optional[int] = None
    academic_year: Optional[str] = Field(None, max_length=10)

class UserLoginRequest(BaseModel):
    college_email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str
    college_email: str

class UserResponse(BaseModel):
    user_id: int
    college_email: str
    student_or_staff_id: str
    full_name: str
    role_id: int
    role_name: str
    department_id: Optional[int] = None
    dept_name: Optional[str] = None
    academic_year: Optional[str] = None
    is_verified: bool
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
