from datetime import datetime
from typing import List, Optional
from beanie import Document, Link
from pydantic import Field
from app.models.content_profile import ContentProfile


class Display(Document):
    display_id: str = Field(
        ...,
        unique=True,
        min_length=3,
        max_length=30,
    )
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )
    ip_address: str = Field(
        ...,
    )
    location: str = Field(
        ...,
        min_length=2,
        max_length=150,
    )
    status: str = Field(
        "ACTIVE",
        pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$",
    )
    content_profiles: List[Link[ContentProfile]] = Field(
        default=[],
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
    )

    class Settings:
        name = "displays"
        indexes = [
            "display_id",
            "status",
            [
                ("name", "text"),
                ("location", "text"),
                ("ip_address", "text"),
            ],
        ]
