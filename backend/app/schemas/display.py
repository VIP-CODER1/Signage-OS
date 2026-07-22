from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DisplayCreate(BaseModel):
    display_id: str = Field(..., min_length=3, max_length=30)
    name: str = Field(..., min_length=2, max_length=100)
    ip_address: str = Field(..., description="IPv4 or IPv6 address")
    location: str = Field(..., min_length=2, max_length=150)
    status: str = Field("ACTIVE", pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$")
    content_profiles: List[str] = Field(default=[], description="Content profile NAMES to link")


class DisplayUpdate(BaseModel):
    display_id: Optional[str] = Field(None, min_length=3, max_length=30)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    ip_address: Optional[str] = None
    location: Optional[str] = Field(None, min_length=2, max_length=150)
    status: Optional[str] = Field(None, pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$")
    content_profiles: Optional[List[str]] = None


class ContentProfileRef(BaseModel):
    id: str
    name: str
    priority: str


class DisplayResponse(BaseModel):
    id: str
    display_id: str
    name: str
    ip_address: str
    location: str
    status: str
    content_profiles: List[ContentProfileRef]
    created_at: datetime
    updated_at: Optional[datetime] = None


class PaginationMeta(BaseModel):
    total: int
    page: int
    limit: int
    pages: int


class DisplayListResponse(BaseModel):
    data: List[DisplayResponse]
    pagination: PaginationMeta
