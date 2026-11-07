from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controllers.auth_controller import auth_controller
from app.middleware.auth_middleware import get_current_user
from app.models.user_model import User
from app.schemas.auth_schema import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(request: UserRegisterRequest, db: Session = Depends(get_db)):
    user = auth_controller.register(db, request)
    return UserResponse(
        user_id=user.user_id,
        college_email=user.college_email,
        student_or_staff_id=user.student_or_staff_id,
        full_name=user.full_name,
        role_id=user.role_id,
        role_name=user.role.role_name if user.role else "Student",
        department_id=user.department_id,
        dept_name=user.department.dept_name if user.department else None,
        academic_year=user.academic_year,
        is_verified=user.is_verified,
        is_active=user.is_active,
        created_at=user.created_at
    )

@router.post("/login", response_model=TokenResponse)
def login(request: UserLoginRequest, db: Session = Depends(get_db)):
    return auth_controller.login(db, request.college_email, request.password)

def serialize_user_profile(current_user: User) -> UserResponse:
    return UserResponse(
        user_id=current_user.user_id,
        college_email=current_user.college_email,
        student_or_staff_id=current_user.student_or_staff_id,
        full_name=current_user.full_name,
        role_id=current_user.role_id,
        role_name=current_user.role.role_name if current_user.role else "Student",
        department_id=current_user.department_id,
        dept_name=current_user.department.dept_name if current_user.department else None,
        academic_year=current_user.academic_year,
        is_verified=current_user.is_verified,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return serialize_user_profile(current_user)

users_router = APIRouter(prefix="/users", tags=["Users"])

@users_router.get("/me", response_model=UserResponse)
def get_user_me(current_user: User = Depends(get_current_user)):
    return serialize_user_profile(current_user)
