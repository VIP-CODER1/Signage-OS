import pytest
from app.models.display import Display


class TestDisplaysAPI:
    @pytest.mark.asyncio
    async def test_list_displays_empty(self, async_client, auth_headers):
        response = await async_client.get("/api/displays", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []
        assert data["pagination"]["total"] == 0
        assert data["pagination"]["page"] == 1

    @pytest.mark.asyncio
    async def test_create_display_success(self, async_client, auth_headers, sample_profile):
        response = await async_client.post("/api/displays", headers=auth_headers, json={
            "display_id": "DSP-NEW-001",
            "name": "New Display",
            "ip_address": "10.0.0.1",
            "location": "New Location",
            "status": "ACTIVE",
            "content_profiles": [sample_profile.name],
        })
        assert response.status_code == 201
        data = response.json()
        assert data["display_id"] == "DSP-NEW-001"
        assert len(data["content_profiles"]) == 1

    @pytest.mark.asyncio
    async def test_create_display_duplicate_id(self, async_client, auth_headers, sample_display):
        response = await async_client.post("/api/displays", headers=auth_headers, json={
            "display_id": sample_display.display_id,
            "name": "Duplicate",
            "ip_address": "10.0.0.2",
            "location": "Somewhere",
        })
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_get_display_by_id(self, async_client, auth_headers, sample_display):
        response = await async_client.get(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["id"] == str(sample_display.id)

    @pytest.mark.asyncio
    async def test_get_display_404(self, async_client, auth_headers):
        response = await async_client.get(
            "/api/displays/000000000000000000000000", headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_display(self, async_client, auth_headers, sample_display):
        response = await async_client.put(
            f"/api/displays/{sample_display.id}",
            headers=auth_headers,
            json={"name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_display(self, async_client, auth_headers, sample_display):
        response = await async_client.delete(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_display_twice_404(self, async_client, auth_headers, sample_display):
        await async_client.delete(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        response = await async_client.delete(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_protected_endpoint_without_token(self, async_client):
        response = await async_client.get("/api/displays")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_search_and_filter(self, async_client, auth_headers, sample_display):
        response = await async_client.get(
            "/api/displays?search=Test&status=ACTIVE&page=1&limit=5",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()["data"]) >= 1
