from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Smart QR Student Verification API"
    debug: bool = True

    database_url: str = (
        "postgresql+psycopg://postgres:123456@localhost:5432/qr_verification"
    )

    jwt_secret_key: str = "CHANGE_THIS_BEFORE_PRODUCTION"
    access_token_expire_minutes: int = 30

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()