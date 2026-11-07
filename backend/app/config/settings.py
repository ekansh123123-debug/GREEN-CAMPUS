from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Green Campus V1"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False

    # Security & JWT Token Auth
    SECRET_KEY: str = "dypcoe-akurdi-green-campus-secret-key-2026-secure"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440 # 24 hours

    # Institutional Domain Requirement
    COLLEGE_EMAIL_DOMAIN: str = "dypcoeakurdi.ac.in"

    # Database (PostgreSQL in production/dev, fallback SQLite inside backend directory)
    DATABASE_URL: str = f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'greencampus.db').replace('\\', '/')}"

    # ImageKit Cloud Storage
    IMAGEKIT_PUBLIC_KEY: str = Field(default="", description="ImageKit Public Key")
    IMAGEKIT_PRIVATE_KEY: str = Field(default="", description="ImageKit Private Key")
    IMAGEKIT_URL_ENDPOINT: str = Field(default="", description="ImageKit URL Endpoint e.g. https://ik.imagekit.io/greencampus")
    IMAGEKIT_FOLDER_ISSUES: str = "/green-campus/issues"
    IMAGEKIT_FOLDER_MARKETPLACE: str = "/green-campus/marketplace"

    # Upload Rules
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024 # 5 MB strictly
    ALLOWED_IMAGE_MIMES: List[str] = ["image/jpeg", "image/png", "image/webp"]

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
