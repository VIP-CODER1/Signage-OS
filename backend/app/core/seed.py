"""Seed script: populate initial admin and content profiles."""
import asyncio
import logging
from app.core.database import init_database
from app.core.security import hash_password
from app.models.admin import Admin
from app.models.content_profile import ContentProfile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROFILES = [
    {"name": "Emergency Alert Broadcast", "priority": "CRITICAL", "description": "Emergency broadcast override"},
    {"name": "Promotional Content Loop", "priority": "MEDIUM", "description": "Default promotional loop"},
    {"name": "Wayfinding Static", "priority": "LOW", "description": "Static wayfinding maps"},
    {"name": "Event Schedule", "priority": "HIGH", "description": "Live event schedules"},
]


async def seed_profiles():
    for profile_data in PROFILES:
        existing = await ContentProfile.find_one(ContentProfile.name == profile_data["name"])
        if not existing:
            await ContentProfile(**profile_data).insert()
            logger.info("Created profile: %s", profile_data["name"])
        else:
            logger.info("Skipped (exists): %s", profile_data["name"])


async def seed_admin():
    existing = await Admin.find_one(Admin.username == "admin@example.com")
    if not existing:
        await Admin(
            username="admin@example.com",
            hashed_password=hash_password("SecurePassword123"),
        ).insert()
        logger.info("Created admin: admin@example.com / SecurePassword123")
    else:
        logger.info("Admin already exists")


async def seed():
    await init_database()
    await seed_admin()
    await seed_profiles()
    logger.info("Seed complete.")

if __name__ == "__main__":
    asyncio.run(seed())
