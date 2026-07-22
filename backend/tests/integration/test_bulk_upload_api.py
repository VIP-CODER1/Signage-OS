import pytest
from io import BytesIO
from openpyxl import Workbook


class TestBulkUploadAPI:
    @pytest.mark.asyncio
    async def test_download_template(self, async_client, auth_headers):
        response = await async_client.get(
            "/api/displays/bulk-upload/template", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == \
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert len(response.content) > 0

    @pytest.mark.asyncio
    async def test_validate_valid_file(self, async_client, auth_headers):
        wb = Workbook()
        ws = wb.active
        ws.title = "Displays"
        ws.append(["display_id", "name", "ip_address", "location", "status", "content_profiles"])
        ws.append(["DSP-UPLOAD-1", "Upload Test", "10.0.0.50", "Upload Zone", "ACTIVE", ""])
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)

        response = await async_client.post(
            "/api/displays/bulk-upload/validate",
            headers=auth_headers,
            files={"file": ("test.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True

    @pytest.mark.asyncio
    async def test_validate_invalid_file(self, async_client, auth_headers):
        wb = Workbook()
        ws = wb.active
        ws.title = "Displays"
        ws.append(["display_id", "name", "ip_address", "location", "status", "content_profiles"])
        ws.append(["DSP-ERR", "", "bad-ip", "", "INVALID", ""])
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)

        response = await async_client.post(
            "/api/displays/bulk-upload/validate",
            headers=auth_headers,
            files={"file": ("test.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False
        assert data["summary"]["failed_rows"] >= 1

    @pytest.mark.asyncio
    async def test_validate_non_excel(self, async_client, auth_headers):
        response = await async_client.post(
            "/api/displays/bulk-upload/validate",
            headers=auth_headers,
            files={"file": ("test.csv", b"a,b,c", "text/csv")},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_commit_valid_preview(self, async_client, auth_headers):
        valid_row = {
            "display_id": "DSP-COMMIT-1",
            "name": "Commit Test",
            "ip_address": "10.0.0.99",
            "location": "Commit Zone",
            "status": "ACTIVE",
            "content_profiles": [],
        }
        response = await async_client.post(
            "/api/displays/bulk-upload/commit",
            headers=auth_headers,
            json={"rows": [valid_row]},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["inserted"] >= 1
