# Phase 1: Database Design & Beanie Models

> **Effort:** 4–6 hours (max) | **Depends on:** Phase 0 | **Agent:** reviewer

---

## Objective

Initialize MongoDB connection via Motor/Beanie, define the two document models (`Display`, `ContentProfile`) with exact field constraints, indexes, and relationships as specified in spec §3.

---

## 1.1 Database Connection — `backend/app/core/database.py`

```python
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.display import Display
from app.models.content_profile import ContentProfile
import logging

logger = logging.getLogger(__name__)

async def init_database():
    """Initialize MongoDB connection and Beanie ODM."""
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    database = client[settings.MONGODB_DB_NAME]

    await init_beanie(
        database=database,
        document_models=[Display, ContentProfile],
    )
    logger.info("MongoDB initialized with Beanie ODM")
    return client
```

### Wiring in `backend/app/main.py` (startup event)

```python
from contextlib import asynccontextmanager
from app.core.database import init_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    client = await init_database()
    yield
    # Shutdown
    client.close()

app = FastAPI(lifespan=lifespan, ...)
```

---

## 1.2 ContentProfile Model — `backend/app/models/content_profile.py`

> **Spec reference:** §3.3 — Stored as a referenced model; a Display can have multiple ContentProfiles.

```python
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
        description="Human-readable content profile name"
    )
    description: Optional[str] = Field(
        None,
        max_length=250,
        description="Optional description of the content profile"
    )
    priority: str = Field(
        "MEDIUM",
        pattern="^(CRITICAL|HIGH|MEDIUM|LOW)$",
        description="Priority level for content scheduling"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of profile creation"
    )

    class Settings:
        name = "content_profiles"
        indexes = ["name"]  # unique enforced by unique=True on the field
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `unique=True` on `name` | Prevents duplicate profile names |
| `pattern` on `priority` | Enforces enum at DB-adjacent layer |
| Separate collection | Profiles shared across displays → normalization |

---

## 1.3 Display Model — `backend/app/models/display.py`

> **Spec reference:** §3.1, §3.3

```python
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
        description="Human-readable alphanumeric identifier (e.g., DSP-001)"
    )
    name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        description="Descriptive display name"
    )
    ip_address: str = Field(
        ...,
        description="IPv4 or IPv6 address of the display's media player"
    )
    location: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Physical location designation"
    )
    status: str = Field(
        "ACTIVE",
        pattern=r"^(ACTIVE|INACTIVE|MAINTENANCE)$",
        description="Current operational status"
    )
    content_profiles: List[Link[ContentProfile]] = Field(
        default=[],
        description="Linked content profiles"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Creation timestamp"
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last update timestamp"
    )

    class Settings:
        name = "displays"
        indexes = [
            "display_id",              # Unique index
            "status",                  # Index for status filter queries
            [                           # Compound text index for search
                ("name", "text"),
                ("location", "text"),
                ("ip_address", "text"),
            ],
        ]
```

---

## 1.4 Index Strategy (from spec §3.1)

```
displays collection:
├── UNIQUE INDEX: display_id        → fast lookup by ID, duplicate prevention
├── INDEX: status                   → fast filter queries by status
└── TEXT INDEX: name + ip_address + location → multi-field search queries

content_profiles collection:
└── UNIQUE INDEX: name → duplicate prevention, fast lookup
```

**Query that hits the text index:**
```python
await Display.find(
    {"$text": {"$search": query_string}}
).skip(skip).limit(limit).to_list()
```

---

## 1.5 Database Relationship Diagram

```
┌─────────────────────────┐         ┌─────────────────────────┐
│        Display          │         │    ContentProfile       │
├─────────────────────────┤         ├─────────────────────────┤
│ _id (ObjectId, PK)      │         │ _id (ObjectId, PK)      │
│ display_id (unique)     │         │ name (unique)           │
│ name                    │◄────────│ description             │
│ ip_address              │ LINK[]  │ priority                │
│ location                │         │ created_at              │
│ status                  │         └─────────────────────────┘
│ content_profiles [Link] │
│ created_at              │
│ updated_at              │
└─────────────────────────┘

One Display  ────►  Many ContentProfiles (via Beanie Link[])
```

---

## 1.6 Bootstrap / Seed Script — `backend/app/core/seed.py`

Create this as a standalone script to pre-populate ContentProfiles for development:

```python
"""Seed script: populate initial content profiles."""
import asyncio
from app.core.database import init_database
from app.models.content_profile import ContentProfile

PROFILES = [
    {"name": "Emergency Alert Broadcast", "priority": "CRITICAL", "description": "Emergency broadcast override"},
    {"name": "Promotional Content Loop", "priority": "MEDIUM", "description": "Default promotional loop"},
    {"name": "Wayfinding Static", "priority": "LOW", "description": "Static wayfinding maps"},
    {"name": "Event Schedule", "priority": "HIGH", "description": "Live event schedules"},
]

async def seed():
    client = await init_database()
    for profile_data in PROFILES:
        existing = await ContentProfile.find_one(ContentProfile.name == profile_data["name"])
        if not existing:
            await ContentProfile(**profile_data).insert()
            print(f"  ✓ Created: {profile_data['name']}")
        else:
            print(f"  ⏭ Skipped (exists): {profile_data['name']}")
    print("Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed())
```

Run: `python -m app.core.seed`

---

## Verification Checklist

- [ ] MongoDB starts via Docker (`docker-compose up mongodb`)
- [ ] Backend starts and connects to MongoDB (no connection errors in logs)
- [ ] `api/health` returns OK
- [ ] Seed script creates 4 content profiles in `content_profiles` collection
- [ ] Ping Beanie document query: `ContentProfile.find_one(ContentProfile.name == "Emergency Alert Broadcast")`
- [ ] Text index exists: check via `mongo` shell — `db.displays.getIndexes()` shows text index

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `researcher` | Verify Beanie `Link[]` patterns for multi-reference, confirm text index syntax for Motor/Beanie |
| `reviewer` | After implementation: verify model field constraints match spec §3.3 exactly (field names, types, regex patterns, min/max lengths) |
| `security-auditor` | (Deferred to Phase 9 — no auth yet) |