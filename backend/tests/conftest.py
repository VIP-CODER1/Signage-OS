import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient
from app.main import app
from app.core.config import settings
from app.core.database import init_database
from app.models.admin import Admin
from app.models.display import Display
from app.models.content_profile import ContentProfile
from app.core.security import hash_password, create_access_token

TEST_DB_NAME = "signage_test_db"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    original_db = settings.MONGODB_DB_NAME
    settings.MONGODB_DB_NAME = TEST_DB_NAME

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_database()

    yield

    await client.drop_database(TEST_DB_NAME)
    client.close()
    settings.MONGODB_DB_NAME = original_db


@pytest_asyncio.fixture
async def admin_token():
    admin = await Admin(
        username="test@example.com",
        hashed_password=hash_password("TestPass123"),
    ).insert()
    token = create_access_token({"sub": str(admin.id), "username": admin.username})
    return token


@pytest_asyncio.fixture
async def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest_asyncio.fixture
async def sample_profile():
    return await ContentProfile(
        name="Test Profile",
        priority="MEDIUM",
    ).insert()


@pytest_asyncio.fixture
async def sample_display(sample_profile):
    display = Display(
        display_id="DSP-TEST-001",
        name="Test Display",
        ip_address="192.168.1.100",
        location="Test Location",
        status="ACTIVE",
        content_profiles=[sample_profile],
    )
    await display.insert()
    return display
