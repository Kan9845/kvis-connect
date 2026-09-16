from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://kvis:kvis@127.0.0.1:5434/kvisconnect"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    ENVIRONMENT: str = "development"  # "production" enables cross-site cookies (SameSite=None; Secure)

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET: str = "kvis-connect"
    S3_REGION: str = ""
    S3_PUBLIC_URL: str = ""

    FRONTEND_URL: str = "http://localhost:3000"
    VERIFICATION_FRONTEND_URL: str = ""  # Single trusted origin for emailed activation links

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.FRONTEND_URL.split(",") if o.strip()]

    REDIS_URL: str = "redis://localhost:6380/0"
    CACHE_ENABLED: bool = True
    CACHE_TTL_SHORT: int = 120
    CACHE_TTL_LONG: int = 300

    MS_TENANT_ID: str = ""
    MS_CLIENT_ID: str = ""
    MS_CLIENT_SECRET: str = ""
    MS_SENDER: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    DISCORD_FEEDBACK_WEBHOOK: str = ""

    GITHUB_TOKEN: str = ""
    GITHUB_REPO: str = "l2holV4l2u/KVIS-Connect"

settings = Settings()
