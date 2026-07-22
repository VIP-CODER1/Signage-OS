from fastapi import APIRouter, HTTPException, status, Request
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.core.security import verify_password, hash_password, create_access_token
from app.models.admin import Admin
from datetime import datetime, timedelta, timezone
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("5/minute")
async def login(body: LoginRequest, request: Request):
    admin = await Admin.find_one(Admin.username == body.email)

    if not admin or not verify_password(body.password, admin.hashed_password):
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
        username=admin.username,
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("3/minute")
async def register(body: RegisterRequest, request: Request):
    existing = await Admin.find_one(Admin.username == body.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    admin = Admin(
        username=body.email,
        hashed_password=hash_password(body.password),
    )
    await admin.insert()

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=480)

    access_token = create_access_token(
        data={"sub": str(admin.id), "username": admin.username}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_at=expires_at,
        username=admin.username,
    )
