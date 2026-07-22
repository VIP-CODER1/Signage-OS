# Phase 2: Authentication System

> **Effort:** 6–8 hours (max) | **Depends on:** Phase 0, Phase 1 | **Agent:** security-auditor (review auth)

---

## Objective

Implement JWT-based authentication: Admin model with bcrypt password hashing, login endpoint issuing HS256 JWT, token verification middleware, and protected route dependency injection.

> **Spec reference:** §4.1, §8.2

---

## 2.1 Admin Model — `backend/app/models/admin.py`

```python
from datetime import datetime
from beanie import Document
from pydantic import Field, EmailStr

class Admin(Document):
    username: str = Field(
        ...,
        unique=True,
        min_length=3,
        max_length=100,
        description="Admin login email/username",
    )
    hashed_password: str = Field(
        ...,
        description="bcrypt hashed password"
    )
    is_active: bool = Field(
        default=True,
        description="Whether admin account is active"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
    )

    class Settings:
        name = "admins"
        indexes = ["username"]
```

**Register in `backend/app/core/database.py`** — add `Admin` to `document_models` list.

---

## 2.2 Password Security — `backend/app/core/security.py`

```python
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# bcrypt via passlib — spec §8.2
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)

# JWT — HS256, 8-hour expiry (§8.2)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with expiry."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token. Returns None if invalid/expired."""
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None
```

---

## 2.3 Auth Schemas — `backend/app/schemas/auth.py`

```python
from pydantic import BaseModel, Field
from datetime import datetime

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime

class ErrorResponse(BaseModel):
    detail: str
```

---

## 2.4 Auth Endpoints — `backend/app/api/v1/endpoints/auth.py`

```python
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.auth import LoginRequest, TokenResponse
from app.core.security import verify_password, create_access_token
from app.models.admin import Admin
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"description": "Invalid credentials", "model": dict}
    }
)
async def login(request: LoginRequest):
    """
    Authenticate administrator and issue JWT.
    Spec §4.1 — No auth required on this endpoint.
    """
    admin = await Admin.find_one(Admin.username == request.username)

    if not admin or not verify_password(request.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=480)

    access_token = create_access_token(
        data={"sub": str(admin.id), "username": admin.username}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_at=expires_at,
    )
```

---

## 2.5 Auth Dependency — `backend/app/api/deps.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_access_token
from app.models.admin import Admin

bearer_scheme = HTTPBearer()

async def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> Admin:
    """Extract and validate JWT, return current Admin.

    Used as a FastAPI dependency on all protected endpoints.
    Spec §4: 'Authorization: Bearer <token>' required on all non-auth endpoints.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )

    admin_id = payload.get("sub")
    if admin_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    admin = await Admin.get(admin_id)
    if admin is None or not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin not found or inactive",
        )

    return admin
```

---

## 2.6 Seed: Create Initial Admin

Add to `backend/app/core/seed.py`:

```python
from app.models.admin import Admin
from app.core.security import hash_password

async def seed_admin():
    existing = await Admin.find_one(Admin.username == "admin@example.com")
    if not existing:
        await Admin(
            username="admin@example.com",
            hashed_password=hash_password("SecurePassword123"),
        ).insert()
        print("  ✓ Created: admin@example.com / SecurePassword123")
```

> **⚠️ Security:** This matches the spec's example credentials. In production, change via env vars. Never hardcode real credentials.

---

## 2.7 Router Registration — `backend/app/api/v1/api.py`

```python
from fastapi import APIRouter
from app.api.v1.endpoints import auth

api_router = APIRouter()
api_router.include_router(auth.router, tags=["Authentication"])
```

In `main.py`:
```python
from app.api.v1.api import api_router
app.include_router(api_router)
```

---

## 2.8 Auth Flow (from spec §1.1, Figure 2)

```
┌──────────┐     POST /api/auth/login      ┌──────────┐
│  Client  │ ──────────────────────────────►│ FastAPI   │
│          │     {username, password}       │  Backend │
│          │                                │          │
│          │ ◄───────────────────────────── │          │
│          │  {access_token, expires_at}    │          │
│          │                                │          │
│          │  GET /api/displays              │          │
│          │  Authorization: Bearer JWT ───► │          │
│          │                                │          │
│          │ ◄──── 200 OK ─────────────────  │          │
│          │                                │          │
│          │  (token expired after 8hr)      │          │
│          │  ◄── 401 "Token expired" ────  │          │
│          │  Redirect to /login             │          │
└──────────┘                                └──────────┘
```

---

## Verification Checklist

- [ ] `POST /api/auth/login` with `admin@example.com:SecurePassword123` returns JWT
- [ ] Response contains `access_token`, `token_type: "bearer"`, `expires_at` (ISO 8601)
- [ ] Invalid credentials → 401 `{"detail": "Incorrect username or password"}`
- [ ] Accessing `GET /api/displays` without Bearer token → 401
- [ ] Accessing `GET /api/displays` with valid Bearer token → 200 (empty or seeded)
- [ ] Expired token → 401 `{"detail": "Token expired"}`
- [ ] Password stored as bcrypt hash in MongoDB (NOT plaintext)

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `security-auditor` | **Crucial.** Audit: bcrypt rounds, JWT secret strength, token expiry enforcement, no plaintext passwords anywhere, brute-force protection (is login rate-limited?), token in localStorage vs httpOnly cookie |
| `reviewer` | Review that `deps.py` properly rejects expired/invalid/missing tokens, verify status codes match spec §7 failure matrix |
| `test-runner` | (Deferred to Phase 8 — write auth test cases) |