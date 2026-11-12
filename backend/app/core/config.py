from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart QR Student Verification API"
    debug: bool = True
    database_url: str = (
        "postgresql+psycopg://postgres:123456@localhost:5432/qr_verification"
    )
    jwt_secret_key: str = "CHANGE_THIS_BEFORE_PRODUCTION"
    access_token_expire_minutes: int = 30

    @field_validator("debug", mode="before")
    @classmethod
    def parse_debug_mode(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "production", "prod", "false", "0", "no"}:
                return False
            if normalized in {"debug", "development", "dev", "true", "1", "yes"}:
                return True
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
