from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://kvis:kvis@127.0.0.1:5434/kvisconnect"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET: str = "kvis-connect"

    FRONTEND_URL: str = "http://localhost:3000"

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "noreply@kvis.ac.th"

    class Config:
        env_file = ".env"


settings = Settings()
