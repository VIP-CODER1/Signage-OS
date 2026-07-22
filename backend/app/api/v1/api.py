from fastapi import APIRouter
from app.api.v1.endpoints import auth, displays, content_profiles

api_router = APIRouter()
api_router.include_router(auth.router, tags=["Authentication"])
api_router.include_router(displays.router, tags=["Displays"])
api_router.include_router(content_profiles.router, tags=["Content Profiles"])
