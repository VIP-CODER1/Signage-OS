import math
from datetime import datetime
from typing import List, Optional, Tuple
from beanie import PydanticObjectId
from bson.errors import InvalidId
from app.models.display import Display
from app.models.content_profile import ContentProfile
from app.schemas.display import DisplayCreate, DisplayUpdate
from app.core.exceptions import DuplicateDisplayIdError


async def resolve_content_profiles(profile_names: List[str]) -> List[ContentProfile]:
    profiles = []
    for name in profile_names:
        name = name.strip()
        if not name:
            continue
        profile = await ContentProfile.find_one(ContentProfile.name == name)
        if not profile:
            profile = ContentProfile(name=name, priority="MEDIUM")
            await profile.insert()
        profiles.append(profile)
    return profiles


async def create_display(data: DisplayCreate) -> Display:
    existing = await Display.find_one(Display.display_id == data.display_id)
    if existing:
        raise DuplicateDisplayIdError(f"Display ID '{data.display_id}' already exists")

    profiles = await resolve_content_profiles(data.content_profiles)

    display = Display(
        display_id=data.display_id,
        name=data.name,
        ip_address=data.ip_address,
        location=data.location,
        status=data.status,
        content_profiles=profiles,
    )
    await display.insert()
    return display


async def get_displays_paginated(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> Tuple[List[Display], dict]:
    query_parts = []

    if search:
        query_parts.append({"$text": {"$search": search}})

    if status_filter:
        query_parts.append({"status": status_filter})

    query = {"$and": query_parts} if query_parts else {}

    total = await Display.find(query).count()

    skip = (page - 1) * limit
    items = await Display.find(query).skip(skip).limit(limit).to_list()

    pagination = {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, math.ceil(total / limit)),
    }

    return items, pagination


async def get_display_by_id(display_id: str) -> Optional[Display]:
    try:
        return await Display.get(PydanticObjectId(display_id))
    except (ValueError, InvalidId):
        return None


async def update_display(display: Display, data: DisplayUpdate) -> Display:
    update_dict = data.model_dump(exclude_unset=True)

    if "content_profiles" in update_dict:
        update_dict["content_profiles"] = await resolve_content_profiles(
            update_dict["content_profiles"]
        )

    for field, value in update_dict.items():
        setattr(display, field, value)

    display.updated_at = datetime.utcnow()
    await display.save()
    return display


async def delete_display(display: Display) -> None:
    await display.delete()
