from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import email_validator

# Disable DNS MX lookup for fast offline validation
email_validator.CHECK_DELIVERABILITY = False


class Settings(BaseSettings):
    PROJECT_NAME: str = "E-commerce Profit & Ads Intelligence SaaS"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    # Standard format: postgresql+asyncpg://user:pass@host/dbname
    DATABASE_URL: str = "sqlite+aiosqlite:///./test.db"

    # Security & JWT
    SECRET_KEY: str = "supersecretdevelopmentkeythatisatleast32byteslong123456"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            # If standard postgresql:// is provided from Neon, convert to postgresql+asyncpg://
            if v.startswith("postgresql://"):
                v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgres://"):
                v = v.replace("postgres://", "postgresql+asyncpg://", 1)
            # Remove sslmode=require from query string as asyncpg handles SSL via connect_args
            if "sslmode=require" in v:
                v = v.replace("?sslmode=require", "").replace("&sslmode=require", "")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
