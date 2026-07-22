from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ContentProfileCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=250)
    priority: str = Field("MEDIUM", pattern=r"^(CRITICAL|HIGH|MEDIUM|LOW)$")


class ContentProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=250)
    priority: Optional[str] = Field(None, pattern=r"^(CRITICAL|HIGH|MEDIUM|LOW)$")


class ContentProfileResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    priority: str
    created_at: datetime
