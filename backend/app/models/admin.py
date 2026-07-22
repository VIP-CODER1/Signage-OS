from datetime import datetime
from beanie import Document
from pydantic import Field


class Admin(Document):
    username: str = Field(
        ...,
        unique=True,
        min_length=3,
        max_length=100,
    )
    hashed_password: str = Field(
        ...,
    )
    is_active: bool = Field(
        default=True,
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
    )

    class Settings:
        name = "admins"
        indexes = ["username"]
