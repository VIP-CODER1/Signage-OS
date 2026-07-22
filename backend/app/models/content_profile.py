from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field


class ContentProfile(Document):
    name: str = Field(
        ...,
        unique=True,
        min_length=2,
        max_length=50,
    )
    description: Optional[str] = Field(
        None,
        max_length=250,
    )
    priority: str = Field(
        "MEDIUM",
        pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
    )

    class Settings:
        name = "content_profiles"
        indexes = ["name"]
