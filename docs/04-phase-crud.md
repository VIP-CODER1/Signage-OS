# Phase 3: Display CRUD APIs

> **Effort:** 8–10 hours (max) | **Depends on:** Phase 0, 1, 2 | **Agent:** refactoring-expert, reviewer

---

## Objective

Full REST API for Display resource: paginated list with search/filter, create, read single, update, delete. All endpoints protected by JWT auth.

> **Spec reference:** §4.2

---

## 3.1 Display Schemas — `backend/app/schemas/display.py`

```python
from pydantic import BaseModel, Field, IPvAnyAddress
from typing import List, Optional
from datetime import datetime

# ── Request Schemas ──

class DisplayCreate(BaseModel):
    """Request body for POST /api/displays."""
    display_id: str = Field(..., min_length=3, max_length=30)
    name: str = Field(..., min_length=2, max_length=100)
    ip_address: str = Field(..., description="IPv4 or IPv6 address")
    location: str = Field(..., min_length=2, max_length=150)
    status: str = Field(
        "ACTIVE",
        pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$"
    )
    content_profiles: List[str] = Field(
        default=[],
        description="List of content profile NAMES to link"
    )

class DisplayUpdate(BaseModel):
    """Request body for PUT /api/displays/{id}. All fields optional."""
    display_id: Optional[str] = Field(None, min_length=3, max_length=30)
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    ip_address: Optional[str] = None
    location: Optional[str] = Field(None, min_length=2, max_length=150)
    status: Optional[str] = Field(None, pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$")
    content_profiles: Optional[List[str]] = None

# ── Response Schemas ──

class ContentProfileRef(BaseModel):
    """Nested content profile reference in Display responses."""
    id: str
    name: str
    priority: str

class DisplayResponse(BaseModel):
    """Single Display in API responses."""
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
```

---

## 3.2 Display Service — `backend/app/services/display_service.py`

```python
import math
from datetime import datetime
from typing import List, Optional, Tuple
from beanie import PydanticObjectId
from app.models.display import Display
from app.models.content_profile import ContentProfile
from app.schemas.display import DisplayCreate, DisplayUpdate

# Note: AppException and DuplicateDisplayIdError are defined in
# app/core/exceptions.py (see Phase 7 §7.2) — that is the single source.
# Import them here:
from app.core.exceptions import DuplicateDisplayIdError

async def resolve_content_profiles(profile_names: List[str]) -> List[ContentProfile]:
    """Resolve content profile names to ContentProfile documents.
    Creates profiles that don't exist (with MEDIUM priority default).
    """
    profiles = []
    for name in profile_names:
        name = name.strip()
        if not name:
            continue
        profile = await ContentProfile.find_one(ContentProfile.name == name)
        if not profile:
            # Auto-create unknown profiles (matches spec validation behavior)
            profile = ContentProfile(name=name, priority="MEDIUM")
            await profile.insert()
        profiles.append(profile)
    return profiles

async def create_display(data: DisplayCreate) -> Display:
    """Create a single display. Raises DuplicateDisplayIdError if display_id exists."""
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
        content_profiles=profiles,  # Beanie Link[] — stores ObjectId refs
    )
    await display.insert()
    return display

async def get_displays_paginated(
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> Tuple[List[Display], dict]:
    """Retrieve paginated displays with optional search and status filter."""
    query_parts = []

    if search:
        query_parts.append({"$text": {"$search": search}})

    if status_filter:
        query_parts.append({"status": status_filter})

    query = {"$and": query_parts} if query_parts else {}

    # Count total
    total = await Display.find(query).count()

    # Fetch page
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
    """Get a single display by its MongoDB _id."""
    try:
        return await Display.get(PydanticObjectId(display_id))
    except (ValueError, InvalidId):
        return None

async def update_display(display: Display, data: DisplayUpdate) -> Display:
    """Update an existing display in-place."""
    update_dict = data.model_dump(exclude_unset=True)

    # Handle content_profiles separately — resolve names to links
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
    """Delete a display."""
    await display.delete()
```

---

## 3.3 Display Endpoints — `backend/app/api/v1/endpoints/displays.py`

```python
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.api.deps import get_current_admin
from app.models.admin import Admin
from app.models.display import Display
from app.schemas.display import (
    DisplayCreate, DisplayUpdate,
    DisplayResponse, DisplayListResponse
)
from app.services.display_service import (
    create_display, get_displays_paginated,
    get_display_by_id, update_display, delete_display,
    DuplicateDisplayIdError,
)
from app.services.display_formatter import format_display_response

router = APIRouter(
    prefix="/api/displays",
    tags=["Displays"],
    dependencies=[Depends(get_current_admin)],
)

@router.get("", response_model=DisplayListResponse)
async def list_displays(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search name, IP, or location"),
    status: Optional[str] = Query(None, pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$"),
    _admin: Admin = Depends(get_current_admin),
):
    """Retrieve paginated list of displays. Spec §4.2 — GET /api/displays."""
    items, pagination = await get_displays_paginated(page, limit, search, status)

    return DisplayListResponse(
        data=[format_display_response(d) for d in items],
        pagination=pagination,
    )

@router.post("", response_model=DisplayResponse, status_code=status.HTTP_201_CREATED)
async def create_single_display(
    data: DisplayCreate,
    _admin: Admin = Depends(get_current_admin),
):
    """Create a single display. Spec §4.2 — POST /api/displays."""
    try:
        display = await create_display(data)
    except DuplicateDisplayIdError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Display ID already exists",
        )
    return format_display_response(display)

@router.get("/{id}", response_model=DisplayResponse)
async def get_display(
    id: str,
    _admin: Admin = Depends(get_current_admin),
):
    """Get a single display by its MongoDB _id."""
    display = await get_display_by_id(id)
    if not display:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Display not found")
    return format_display_response(display)

@router.put("/{id}", response_model=DisplayResponse)
async def update_single_display(
    id: str,
    data: DisplayUpdate,
    _admin: Admin = Depends(get_current_admin),
):
    """Edit an existing display. Spec §4.2 — PUT /api/displays/{id}."""
    display = await get_display_by_id(id)
    if not display:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Display not found")

    if data.display_id and data.display_id != display.display_id:
        existing = await Display.find_one(Display.display_id == data.display_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Display ID already exists",
            )

    display = await update_display(display, data)
    return format_display_response(display)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_single_display(
    id: str,
    _admin: Admin = Depends(get_current_admin),
):
    """Delete a display. Spec §4.2 — DELETE /api/displays/{id}."""
    display = await get_display_by_id(id)
    if not display:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Display not found")
    await delete_display(display)
```

---

## 3.4 Response Formatter — `backend/app/services/display_formatter.py`

```python
from app.models.display import Display
from app.models.content_profile import ContentProfile
from app.schemas.display import DisplayResponse, ContentProfileRef

async def format_display_response(display: Display) -> dict:
    """Convert a Display document to API response format."""
    profiles = []
    for link in display.content_profiles:
        # Beanie Link[] may be resolved or lazy — handle both
        if isinstance(link, ContentProfile):
            cp = link
        else:
            cp = await link.fetch()
        profiles.append(ContentProfileRef(
            id=str(cp.id),
            name=cp.name,
            priority=cp.priority,
        ))

    return DisplayResponse(
        id=str(display.id),
        display_id=display.display_id,
        name=display.name,
        ip_address=display.ip_address,
        location=display.location,
        status=display.status,
        content_profiles=profiles,
        created_at=display.created_at,
        updated_at=display.updated_at,
    )
```

---

## 3.5 Router Registration

Update `backend/app/api/v1/api.py`:

```python
from app.api.v1.endpoints import auth, displays

api_router.include_router(displays.router, tags=["Displays"])
```

---

## 3.6 API Endpoint Table (from spec §4.2)

| Method | Endpoint | Auth | Purpose | Response |
|--------|----------|------|---------|----------|
| `GET` | `/api/displays` | JWT | List + search + filter | 200 + paginated |
| `POST` | `/api/displays` | JWT | Create single | 201 |
| `GET` | `/api/displays/{id}` | JWT | Get one | 200 |
| `PUT` | `/api/displays/{id}` | JWT | Update | 200 |
| `DELETE` | `/api/displays/{id}` | JWT | Delete | 204 |

**Query Parameters for GET `/api/displays`:**
- `page` (int, default 1)
- `limit` (int, default 10)
- `search` (str, optional) — matches name, IP, or location
- `status` (str, optional) — ACTIVE, INACTIVE, or MAINTENANCE

---

## Verification Checklist

### Unit-level (manual curl/postman)
- [ ] `GET /api/displays` returns empty data + pagination
- [ ] `POST /api/displays` with valid body → 201 + populated response
- [ ] `POST /api/displays` with duplicate `display_id` → 400
- [ ] `GET /api/displays?search=Lobby` → returns matching display(s)
- [ ] `GET /api/displays?status=ACTIVE` → only ACTIVE displays
- [ ] `GET /api/displays?search=Lobby&status=ACTIVE&page=1&limit=5` → compound works
- [ ] `GET /api/displays/{valid_id}` → 200 with single display
- [ ] `GET /api/displays/{nonexistent_id}` → 404
- [ ] `PUT /api/displays/{id}` with partial body → 200, only changed fields updated
- [ ] `PUT /api/displays/{id}` with existing `display_id` → 400
- [ ] `DELETE /api/displays/{id}` → 204
- [ ] `DELETE /api/displays/{id}` again → 404
- [ ] Content profiles auto-created when not found (spec validation)

### [ ] All endpoints reject unauthenticated requests (401)

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `reviewer` | Verify all status codes and response shapes match spec §4.2 exactly |
| `refactoring-expert` | After CRUD is green: extract any duplication in service layer, check for fat controllers |
| `security-auditor` | Check for IDOR (can admin A's JWT access admin B's displays?), input validation on all fields |