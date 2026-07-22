from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Digital Signage API"
    DEBUG: bool = True

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "signage_db"
    MONGODB_MAX_POOL_SIZE: int = 10
    MONGODB_MIN_POOL_SIZE: int = 2

    JWT_SECRET_KEY: str = "change-me-in-production-use-env-var"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    MAX_UPLOAD_SIZE_MB: int = 10
    RATE_LIMIT_PER_MINUTE: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
