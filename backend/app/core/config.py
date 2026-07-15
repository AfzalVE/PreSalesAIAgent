from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings
    """

    model_config = SettingsConfigDict(
        env_file=[Path(__file__).resolve().parent.parent.parent / ".env", ".env"],
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ----------------------------------
    # Application
    # ----------------------------------
    APP_NAME: str = "AI Proposal Generator API"
    PROJECT_NAME: str = "AI Proposal Generator API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # ----------------------------------
    # Database
    # ----------------------------------
    DATABASE_URL:str='postgresql+psycopg://neondb_owner:npg_wgxYMB8psS4E@ep-odd-heart-addo8465-pooler.c-2.us-east-1.aws.neon.tech/presalesmanagement?sslmode=require&channel_binding=require'

    # ----------------------------------
    # JWT
    # ----------------------------------
    SECRET_KEY:str ='your_super_secret_key_here'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # ----------------------------------
    # AI Providers
    # ----------------------------------
    OPENAI_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None

    # ----------------------------------
    # SMTP
    # ----------------------------------
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()