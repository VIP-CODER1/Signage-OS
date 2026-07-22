from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from beanie import PydanticObjectId
from bson.errors import InvalidId
from app.api.deps import get_current_admin
from app.models.admin import Admin
from app.models.content_profile import ContentProfile
from app.schemas.content_profile import (
    ContentProfileCreate, ContentProfileUpdate, ContentProfileResponse,
)

router = APIRouter(
    prefix="/api/content-profiles",
    tags=["Content Profiles"],
    dependencies=[Depends(get_current_admin)],
)


async def _format_profile(p):
    return ContentProfileResponse(
        id=str(p.id),
        name=p.name,
        description=p.description,
        priority=p.priority,
        created_at=p.created_at,
    )


@router.get("", response_model=List[ContentProfileResponse])
async def list_profiles(_admin: Admin = Depends(get_current_admin)):
    profiles = await ContentProfile.find_all().to_list()
    return [_format_profile(p) for p in profiles]


@router.post("", response_model=ContentProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    data: ContentProfileCreate,
    _admin: Admin = Depends(get_current_admin),
):
    existing = await ContentProfile.find_one(ContentProfile.name == data.name)
    if existing:
        raise HTTPException(status_code=400, detail="Profile name already exists")
    profile = ContentProfile(**data.model_dump())
    await profile.insert()
    return _format_profile(profile)


@router.get("/{id}", response_model=ContentProfileResponse)
async def get_profile(
    id: str,
    _admin: Admin = Depends(get_current_admin),
):
    try:
        profile = await ContentProfile.get(PydanticObjectId(id))
    except (ValueError, InvalidId):
        profile = None
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return _format_profile(profile)


@router.put("/{id}", response_model=ContentProfileResponse)
async def update_profile(
    id: str,
    data: ContentProfileUpdate,
    _admin: Admin = Depends(get_current_admin),
):
    try:
        profile = await ContentProfile.get(PydanticObjectId(id))
    except (ValueError, InvalidId):
        profile = None
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(profile, field, value)
    await profile.save()
    return _format_profile(profile)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    id: str,
    _admin: Admin = Depends(get_current_admin),
):
    try:
        profile = await ContentProfile.get(PydanticObjectId(id))
    except (ValueError, InvalidId):
        profile = None
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await profile.delete()
