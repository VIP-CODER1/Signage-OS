import pytest
from app.core.security import hash_password
from app.models.admin import Admin


class TestAuthAPI:
    @pytest.mark.asyncio
    async def test_login_success(self, async_client):
        await Admin(
            username="admin@test.com",
            hashed_password=hash_password("CorrectPass123"),
        ).insert()

        response = await async_client.post("/api/auth/login", json={
            "email": "admin@test.com",
            "password": "CorrectPass123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_at" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client):
        await Admin(
            username="admin@test.com",
            hashed_password=hash_password("CorrectPass123"),
        ).insert()

        response = await async_client.post("/api/auth/login", json={
            "email": "admin@test.com",
            "password": "WrongPassword",
        })
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect username or password"

    @pytest.mark.asyncio
    async def test_login_wrong_username(self, async_client):
        response = await async_client.post("/api/auth/login", json={
            "email": "ghost@test.com",
            "password": "AnyPass123",
        })
        assert response.status_code == 401
