from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from jose import jwt
from sqlalchemy.orm import Session
import bcrypt

from app.config.settings import settings
from app.models.user_model import User, Role
from app.schemas.auth_schema import UserRegisterRequest, TokenResponse

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8")[:72],
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

class AuthController:
    @staticmethod
    def register(db: Session, request: UserRegisterRequest) -> User:
        # 1. Enforce strict institutional domain check (TC-09)
        email_str = str(request.college_email).lower()
        domain = email_str.split("@")[-1]
        if domain != settings.COLLEGE_EMAIL_DOMAIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration restricted to institutional emails (@{settings.COLLEGE_EMAIL_DOMAIN})"
            )

        # 2. Check duplicate email
        existing_email = db.query(User).filter(User.college_email == email_str).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="College email is already registered."
            )

        # 3. Check duplicate student/staff ID
        existing_id = db.query(User).filter(User.student_or_staff_id == request.student_or_staff_id).first()
        if existing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student/Staff ID is already registered."
            )

        # 4. Verify Role
        role = db.query(Role).filter(Role.role_id == request.role_id).first()
        if not role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role_id specified."
            )

        # 5. Create user
        hashed_pwd = get_password_hash(request.password)
        new_user = User(
            college_email=email_str,
            student_or_staff_id=request.student_or_staff_id,
            full_name=request.full_name,
            password_hash=hashed_pwd,
            role_id=request.role_id,
            department_id=request.department_id,
            academic_year=request.academic_year,
            is_verified=True, # Allowed verified in V1 dev/academic environment
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def login(db: Session, email: str, password: str) -> TokenResponse:
        email_str = email.strip().lower()
        user = db.query(User).filter(User.college_email == email_str).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid college email or password."
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is currently suspended or inactive."
            )

        role_name = user.role.role_name if user.role else "Student"
        token_payload = {
            "sub": str(user.user_id),
            "role": role_name,
            "email": user.college_email
        }
        access_token = create_access_token(token_payload)

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            role=role_name,
            user_id=user.user_id,
            full_name=user.full_name,
            college_email=user.college_email
        )

auth_controller = AuthController()
