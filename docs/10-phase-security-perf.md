# Phase 9: Security & Performance

> **Effort:** 6–8 hours (max) | **Depends on:** All Phases (0–7) | **Agent:** security-auditor

---

## Objective

Harden the application against common vulnerabilities and optimize performance per spec §8. Security: bcrypt password hashing, JWT lifecycle, input sanitization, Excel DoS protection. Performance: bulk DB inserts, pagination, async parsing, indexing audit.

> **Spec reference:** §8.1 (Performance), §8.2 (Security & Hardening)

---

## 9.1 Security Audit Checklist (spec §8.2)

### 9.1.1 Password Hashing — bcrypt via passlib

**Status:** ✅ Implemented in Phase 2 (`backend/app/core/security.py`).

**Verify:**
```bash
# Check bcrypt rounds (default = 12)
python3 -c "from passlib.context import CryptContext; ctx = CryptContext(schemes=['bcrypt']); print(ctx.hash('test'))"
# Output should start with $2b$12$ (or $2b$ rounds value)
```

**Hardening:** Increase bcrypt rounds to 13+ for production:
```python
# backend/app/core/security.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=13)
```

### 9.1.2 JWT Lifecycle — HS256, 8hr expiry, secure secret

**Status:** ✅ Implemented in Phase 2 (`backend/app/core/config.py`, `security.py`).

**Verify:**
- Algorithm: HS256 ✅
- Expiry: 480 minutes (8 hours) ✅
- Secret: Read from env var, never hardcoded in production ✅

**Hardening:**
```python
# backend/app/core/config.py
JWT_SECRET_KEY: str = Field(..., description="Production secret: use openssl rand -hex 32")
# Remove default "change-me-in-production-use-env-var" string in production

# Add JWT refresh endpoint (optional enhancement):
# POST /api/auth/refresh — issue new token if current is within 1hr of expiry
```

### 9.1.3 Input Sanitization — Pydantic validation (spec §8.2)

**Status:** ✅ Backend uses Pydantic for all request schemas (Phases 2–4).

**Verify all schemas have:**
- `min_length` / `max_length` on all string fields
- `pattern` / `regex` on enum fields (status, priority)
- `IPvAnyAddress` on ip_address (consider using Pydantic's IPvAnyAddress validator)

**Enhance:**
```python
# backend/app/schemas/display.py — use IPvAnyAddress for stronger validation
from pydantic import IPvAnyAddress

class DisplayCreate(BaseModel):
    ip_address: IPvAnyAddress = Field(...)
```

### 9.1.4 Excel Upload DoS Protection (spec §8.2)

**Status:** ✅ 10MB file size limit in Phase 4 (`excel_parser.py`).

**Hardening additions:**
```python
# backend/app/services/excel_parser.py — additional safeguards

# 1. Decompression bomb protection: check ratio
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_EXPANSION_RATIO = 100  # if unzipped > 100x compressed size, reject

# 2. Row count limit
MAX_ROWS = 10000  # reject files with more than 10K rows

# 3. Cell character limit
MAX_CELL_LENGTH = 500  # truncate or reject individual cells exceeding this

# 4. Use read_only mode (already implemented)
wb = load_workbook(BytesIO(file_content), read_only=True)
```

### 9.1.5 CORS Hardening

```python
# backend/app/core/config.py
# In production, restrict origins to the actual frontend domain:
CORS_ORIGINS: List[str] = ["https://signage.example.com"]

# In main.py, add security headers middleware:
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["signage.example.com", "localhost", "127.0.0.1"],
)

# Add security headers
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Cache-Control"] = "no-store"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

### 9.1.6 Rate Limiting (brute-force protection)

> Spec §8.2 implies login rate limiting. FastAPI doesn't have built-in rate limiting but can use slowapi.

```bash
pip install slowapi
```

```python
# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to login endpoint:
# backend/app/api/v1/endpoints/auth.py
@router.post("/login")
@limiter.limit("5/minute")  # 5 attempts per minute per IP
async def login(request: LoginRequest):
    ...
```

### 9.1.7 IDOR (Insecure Direct Object Reference) Check

**Status:** Display CRUD uses MongoDB `_id` which is not easily guessable. No user-scoped data exists — single admin model.

**Verify:**
- All endpoints use `get_current_admin` dependency ✅
- Admin can only access what they're authorized for (single-tenant admin) ✅
- No user A / user B separation to worry about ✅

---

## 9.2 Performance Optimization Checklist (spec §8.1)

### 9.2.1 Bulk Database Inserts (spec §8.1)

**Status:** ✅ Planned in Phase 4 commit logic uses `create_display` per row.

**Optimize:** Replace row-by-row insert with `insert_many()`:

```python
# backend/app/services/display_service.py — batch insert
async def create_displays_bulk(displays_data: List[DisplayCreate]) -> List[Display]:
    """Bulk create displays using insert_many()."""
    displays = []
    for data in displays_data:
        profiles = await resolve_content_profiles(data.content_profiles)
        displays.append(Display(
            display_id=data.display_id,
            name=data.name,
            ip_address=data.ip_address,
            location=data.location,
            status=data.status,
            content_profiles=profiles,
        ))

    if displays:
        await Display.insert_many(displays)
    return displays
```

### 9.2.2 Pagination (spec §8.1)

**Status:** ✅ Implemented in Phase 3 (`display_service.py` — `skip` + `limit`).

**Verify:**
- All list endpoints use pagination ✅
- Default limit = 10, max limit = 100 ✅
- Page parameter has minimum = 1 ✅

### 9.2.3 Async Parsing (spec §8.1)

**Status:** ✅ Phase 4 excel_parser uses async/await throughout.

**Verify:**
- `validate_excel()` is an async function ✅
- DB lookups use `await` ✅
- File I/O is non-blocking ✅
- `read_only=True` mode used for memory efficiency ✅

### 9.2.4 MongoDB Index Audit

**Status:** ✅ Indexes defined in Phase 2 models.

**Verify indexes exist:**
```bash
# Connect to MongoDB and verify
docker exec -it signage-mongo mongosh signage_db --eval "db.displays.getIndexes()"
# Expected: unique index on display_id, text index on name+ip_address+location

docker exec -it signage-mongo mongosh signage_db --eval "db.content_profiles.getIndexes()"
# Expected: unique index on name
```

**Add missing indexes for performance queries:**
```python
# backend/app/models/display.py — add status index for filter queries
class Settings:
    name = "displays"
    indexes = [
        "display_id",
        "status",              # ← add this for status filter queries
        [("name", "text"), ("location", "text"), ("ip_address", "text")],
    ]
```

### 9.2.5 Database Connection Pooling

```python
# backend/app/core/config.py
MONGODB_MAX_POOL_SIZE: int = 10
MONGODB_MIN_POOL_SIZE: int = 2

# backend/app/core/database.py
client = AsyncIOMotorClient(
    settings.MONGODB_URL,
    maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
    minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
    serverSelectionTimeoutMS=5000,  # 5 second timeout
    connectTimeoutMS=5000,
)
```

### 9.2.6 Frontend Performance

```jsx
// 1. Lazy load routes — frontend/src/App.jsx
import { lazy, Suspense } from 'react';
import { CircularProgress } from '@mui/material';

const DisplaysPage = lazy(() => import('./pages/DisplaysPage'));
const DisplayDetailPage = lazy(() => import('./pages/DisplayDetailPage'));
const BulkUploadPage = lazy(() => import('./pages/BulkUploadPage'));

// Wrap in Suspense:
<Suspense fallback={<CircularProgress />}>
  <DisplaysPage />
</Suspense>

// 2. Memoize expensive components — frontend/src/components/displays/DisplayTable.jsx
import { memo } from 'react';
export default memo(DisplayTable);

// 3. Debounce search input (300ms) — already in SearchBar

// 4. Image/assets optimization — use WebP, lazy load images
```

---

## 9.3 Security & Performance Runbook

### Pre-Deployment Security Checks

| Check | Command / Action | Expected |
|-------|-----------------|----------|
| Secret scan | `grep -r "change-me" backend/` | No matches |
| JWT secret length | `echo ${#JWT_SECRET_KEY}` | ≥ 32 chars |
| bcrypt rounds | Check `bcrypt__rounds=13` in config | 13 |
| CORS origins | Check settings.CORS_ORIGINS | Production URL, not `*` |
| File upload limit | Check `MAX_UPLOAD_SIZE_MB` | 10 |
| Rate limiting | Check login endpoint has `@limiter.limit` | 5/minute |
| Security headers | `curl -I https://signage.example.com` | XSS, HSTS, nosniff headers present |

### Pre-Deployment Performance Checks

| Check | Command / Action | Expected |
|-------|-----------------|----------|
| Indexes exist | `mongosh` getIndexes() | All indexes present |
| Pagination | GET `/api/displays?page=1&limit=10` | Returns ≤ 10 items |
| Bulk insert | POST `/bulk-upload/commit` with 1000 rows | < 5 seconds |
| DB timeout | `serverSelectionTimeoutMS` | 5000ms |
| Connection pool | `maxPoolSize` | 10 |

---

## 9.4 Environment Variable Configuration

### `backend/.env` (production)

```env
# App
DEBUG=false

# MongoDB
MONGODB_URL=mongodb://mongodb:27017
MONGODB_DB_NAME=signage_db

# JWT — generate with: openssl rand -hex 32
JWT_SECRET_KEY=<generated-64-char-hex>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# CORS
CORS_ORIGINS=["https://signage.example.com"]

# Upload
MAX_UPLOAD_SIZE_MB=10

# Rate Limiting
RATE_LIMIT_PER_MINUTE=5
```

---

## Verification Checklist

### Security
- [ ] No hardcoded secrets in code — all via env vars
- [ ] JWT secret is ≥ 32 characters (checked)
- [ ] JWT algorithm is HS256 (not None or weak)
- [ ] Token expiry is 480 minutes (8 hours)
- [ ] bcrypt rounds ≥ 12
- [ ] Login rate-limited: 5 attempts per minute
- [ ] Excel upload limited to 10MB
- [ ] CORS origins restricted (not `*`) in production
- [ ] Security headers: X-Content-Type-Options, X-Frame-Options, HSTS
- [ ] TrustedHostMiddleware active in production
- [ ] No SQL/NoSQL injection vectors (all inputs via Pydantic)

### Performance
- [ ] Bulk insert uses `insert_many()` (not row-by-row)
- [ ] All list endpoints paginated with skip/limit
- [ ] Text index on displays (name, ip_address, location)
- [ ] Unique index on display_id
- [ ] Unique index on content_profiles.name
- [ ] Status index on displays collection
- [ ] MongoDB connection pooling configured (max 10)
- [ ] Database timeout set to 5 seconds
- [ ] Frontend routes lazy-loaded with React.lazy
- [ ] DisplayTable is memoized with React.memo
- [ ] Search input debounced (300ms)

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `security-auditor` | **Primary.** Run full audit: scan for hardcoded secrets, verify bcrypt strength, test JWT expiry, check CORS config, test rate limiting, verify Excel DoS protections, attempt injection vectors. Produce a security report |
| `refactoring-expert` | After security: refactor `display_service.py` to use `insert_many()`, add connection pooling config, ensure async parsing is non-blocking |
| `reviewer` | Verify all environment variables are documented in .env.example. Check that DEBUG mode is off in production. Ensure Pydantic schemas use IPvAnyAddress |
