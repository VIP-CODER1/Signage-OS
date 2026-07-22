import logging
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.models.admin import Admin
from app.models.display import Display
from app.models.content_profile import ContentProfile

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient = None


async def init_database():
    global _client
    _client = AsyncIOMotorClient(
        settings.MONGODB_URL,
        maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
        minPoolSize=settings.MONGODB_MIN_POOL_SIZE,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    database = _client[settings.MONGODB_DB_NAME]

    await init_beanie(
        database=database,
        document_models=[Admin, Display, ContentProfile],
    )
    logger.info("MongoDB initialized with Beanie ODM")
    return _client


async def check_db_health() -> bool:
    try:
        if _client is None:
            return False
        await _client.admin.command("ping")
        return True
    except Exception:
        return False
