# Phase 8: Testing

> **Effort:** 10–12 hours (max) | **Depends on:** All Phases (0–7) | **Agent:** test-runner

---

## Objective

Implement the four-tier testing matrix from spec §9: backend unit tests, API integration tests, Redux state management tests, and UI component tests. Achieve 80%+ coverage on business logic.

> **Spec reference:** §9 (Testing Strategy)

---

## 8.1 Backend Test Setup — `backend/tests/`

### `backend/tests/conftest.py` — Shared Fixtures

```python
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

# Use a separate test database
TEST_DB_NAME = "signage_test_db"

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    """Override DB name to test database, clean between tests."""
    original_db = settings.MONGODB_DB_NAME
    settings.MONGODB_DB_NAME = TEST_DB_NAME

    # Connect and initialize
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_database()

    yield

    # Cleanup: drop test database
    await client.drop_database(TEST_DB_NAME)
    client.close()
    settings.MONGODB_DB_NAME = original_db

@pytest_asyncio.fixture
async def admin_token():
    """Create test admin and return JWT."""
    admin = await Admin(
        username="test@example.com",
        hashed_password=hash_password("TestPass123"),
    ).insert()
    token = create_access_token({"sub": str(admin.id), "username": admin.username})
    return token

@pytest_asyncio.fixture
async def auth_headers(admin_token):
    """Return Authorization header dict."""
    return {"Authorization": f"Bearer {admin_token}"}

@pytest_asyncio.fixture
async def async_client():
    """FastAPI test client using httpx.AsyncClient."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest_asyncio.fixture
async def sample_profile():
    """Create a reusable content profile."""
    return await ContentProfile(
        name="Test Profile",
        priority="MEDIUM",
    ).insert()

@pytest_asyncio.fixture
async def sample_display(sample_profile):
    """Create a reusable display with linked profile."""
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
```

### `backend/tests/requirements-test.txt`

```txt
pytest==8.3.0
pytest-asyncio==0.24.0
pytest-cov==5.0.0
httpx==0.27.0
```

---

## 8.2 Unit Tests — Excel Parsing Logic (spec §9.1)

> Test `excel_parser.py` validation functions with mock xlsx files.

### `backend/tests/unit/test_excel_parser.py`

```python
import pytest
from io import BytesIO
from openpyxl import Workbook
from app.services.excel_parser import (
    IPV4_PATTERN, IPV6_PATTERN, VALID_STATUSES,
    validate_excel, ExcelParseError,
)

class TestIPValidation:
    """Spec §9.1 — IP address validation utility tests."""

    @pytest.mark.parametrize("valid_ip", [
        "192.168.1.1",
        "10.0.0.1",
        "172.16.0.1",
        "255.255.255.255",
        "0.0.0.0",
    ])
    def test_valid_ipv4(self, valid_ip):
        assert IPV4_PATTERN.match(valid_ip)

    @pytest.mark.parametrize("invalid_ip", [
        "256.0.0.1",
        "192.168.1",
        "192.168.1.1.1",
        "abc.def.ghi.jkl",
        " 192.168.1.1",  # leading space
        "",
    ])
    def test_invalid_ipv4(self, invalid_ip):
        assert not IPV4_PATTERN.match(invalid_ip)

    @pytest.mark.parametrize("valid_ipv6", [
        "::1",
        "2001:db8::1",
        "fe80::1",
        "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
    ])
    def test_valid_ipv6(self, valid_ipv6):
        assert IPV6_PATTERN.match(valid_ipv6)


class TestStatusValidation:
    """Spec §9.1 — Status enum validation."""

    def test_valid_statuses(self):
        for status in ["ACTIVE", "INACTIVE", "MAINTENANCE"]:
            assert status in VALID_STATUSES

    def test_invalid_statuses(self):
        for status in ["active", "Active", "DISABLED", "", "PENDING"]:
            assert status not in VALID_STATUSES


class TestExcelParsing:
    """Spec §9.1 — Full Excel parsing with mock xlsx."""

    def _create_valid_xlsx(self) -> BytesIO:
        wb = Workbook()
        ws = wb.active
        ws.title = "Displays"
        ws.append(["display_id", "name", "ip_address", "location", "status", "content_profiles"])
        ws.append(["DSP-101", "Screen 1", "192.168.1.10", "Zone A", "ACTIVE", "Test Profile"])
        ws.append(["DSP-102", "Screen 2", "192.168.1.11", "Zone B", "INACTIVE", ""])
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf

    def _create_xlsx_with_errors(self) -> BytesIO:
        wb = Workbook()
        ws = wb.active
        ws.title = "Displays"
        ws.append(["display_id", "name", "ip_address", "location", "status", "content_profiles"])
        ws.append(["DSP-101", "A", "999.999.9.9", "X", "INVALID", "Unknown"])
        ws.append(["DSP-101", "", "not-an-ip", "", "", "Missing"])
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        return buf

    @pytest.mark.asyncio
    async def test_valid_parse(self):
        buf = self._create_valid_xlsx()
        result = await validate_excel(buf.read(), "test.xlsx")
        assert result.is_valid is True
        assert result.summary.total_rows == 2
        assert result.summary.valid_rows == 2
        assert result.summary.failed_rows == 0

    @pytest.mark.asyncio
    async def test_parse_with_errors(self):
        buf = self._create_xlsx_with_errors()
        result = await validate_excel(buf.read(), "test.xlsx")
        assert result.is_valid is False
        assert result.summary.failed_rows > 0
        # Check that errors contain field-level details
        assert any("ip_address" in str(e.field) for e in result.preview[0].errors)
        assert any("status" in str(e.field) for e in result.preview[0].errors)

    @pytest.mark.asyncio
    async def test_wrong_file_extension(self):
        with pytest.raises(ExcelParseError, match="must be a .xlsx"):
            await validate_excel(b"fake content", "test.csv")

    @pytest.mark.asyncio
    async def test_file_too_large(self):
        large_content = b"x" * (10 * 1024 * 1024 + 1)
        with pytest.raises(ExcelParseError, match="exceeds 10MB"):
            await validate_excel(large_content, "test.xlsx")

    @pytest.mark.asyncio
    async def test_missing_required_column(self):
        wb = Workbook()
        ws = wb.active
        ws.title = "Displays"
        ws.append(["name", "ip_address"])  # missing display_id, location
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        with pytest.raises(ExcelParseError, match="Missing column"):
            await validate_excel(buf.read(), "test.xlsx")

    @pytest.mark.asyncio
    async def test_duplicate_intra_sheet(self):
        wb = Workbook()
        ws = wb.active
        ws.title = "Displays"
        ws.append(["display_id", "name", "ip_address", "location", "status", "content_profiles"])
        ws.append(["DSP-101", "Screen 1", "192.168.1.10", "Zone A", "ACTIVE", ""])
        ws.append(["DSP-101", "Screen 2", "192.168.1.11", "Zone B", "ACTIVE", ""])
        buf = BytesIO()
        wb.save(buf)
        buf.seek(0)
        result = await validate_excel(buf.read(), "test.xlsx")
        assert result.is_valid is False
        dup_errors = [r for r in result.preview if not r.is_valid]
        assert any("duplicate" in str(e).lower() for r in dup_errors for e in r.errors)
```

---

## 8.3 Unit Tests — Password Hashing (spec §9.1)

### `backend/tests/unit/test_security.py`

```python
import pytest
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token

class TestPasswordHashing:
    """Spec §9.1 — Password hashing utility tests."""

    def test_hash_returns_string(self):
        hashed = hash_password("SecurePassword123")
        assert isinstance(hashed, str)
        assert hashed.startswith("$2b$")  # bcrypt prefix

    def test_verify_correct_password(self):
        hashed = hash_password("SecurePassword123")
        assert verify_password("SecurePassword123", hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("SecurePassword123")
        assert verify_password("WrongPassword", hashed) is False

    def test_same_password_different_hashes(self):
        """bcrypt salts ensure no two hashes are identical."""
        h1 = hash_password("SamePass123")
        h2 = hash_password("SamePass123")
        assert h1 != h2


class TestJWT:
    """Spec §9.1 — JWT creation and decoding tests."""

    def test_create_token_returns_string(self):
        token = create_access_token({"sub": "test-id", "username": "test"})
        assert isinstance(token, str)
        assert len(token.split(".")) == 3  # header.payload.signature

    def test_decode_valid_token(self):
        token = create_access_token({"sub": "test-id", "username": "test"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "test-id"
        assert payload["username"] == "test"

    def test_decode_expired_token_returns_none(self):
        from datetime import timedelta
        token = create_access_token(
            {"sub": "test-id"},
            expires_delta=timedelta(seconds=-1),  # already expired
        )
        payload = decode_access_token(token)
        assert payload is None

    def test_decode_invalid_token_returns_none(self):
        assert decode_access_token("invalid.token.here") is None
```

---

## 8.4 API Integration Tests (spec §9.2)

> Using httpx AsyncClient with FastAPI's ASGI transport.

### `backend/tests/integration/test_auth_api.py`

```python
import pytest
from app.core.security import hash_password
from app.models.admin import Admin

class TestAuthAPI:
    """Spec §9.2 — Auth flow integration tests."""

    @pytest.mark.asyncio
    async def test_login_success(self, async_client):
        """Correct credentials return JWT."""
        # Create admin first
        await Admin(
            username="admin@test.com",
            hashed_password=hash_password("CorrectPass123"),
        ).insert()

        response = await async_client.post("/api/auth/login", json={
            "username": "admin@test.com",
            "password": "CorrectPass123",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_at" in data

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, async_client):
        """Wrong password returns 401."""
        await Admin(
            username="admin@test.com",
            hashed_password=hash_password("CorrectPass123"),
        ).insert()

        response = await async_client.post("/api/auth/login", json={
            "username": "admin@test.com",
            "password": "WrongPassword",
        })
        assert response.status_code == 401
        assert response.json()["detail"] == "Incorrect username or password"

    @pytest.mark.asyncio
    async def test_login_wrong_username(self, async_client):
        """Non-existent admin returns 401."""
        response = await async_client.post("/api/auth/login", json={
            "username": "ghost@test.com",
            "password": "AnyPass123",
        })
        assert response.status_code == 401
```

### `backend/tests/integration/test_displays_api.py`

```python
import pytest
from app.models.display import Display
from app.models.content_profile import ContentProfile

class TestDisplaysAPI:
    """Spec §9.2 — CRUD endpoints integration tests."""

    @pytest.mark.asyncio
    async def test_list_displays_empty(self, async_client, auth_headers):
        """GET /api/displays returns empty paginated response."""
        response = await async_client.get("/api/displays", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["data"] == []
        assert data["pagination"]["total"] == 0
        assert data["pagination"]["page"] == 1

    @pytest.mark.asyncio
    async def test_create_display_success(self, async_client, auth_headers, sample_profile):
        """POST /api/displays with valid data returns 201."""
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
        """POST with existing display_id returns 400."""
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
        """GET /api/displays/{id} returns the display."""
        response = await async_client.get(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["id"] == str(sample_display.id)

    @pytest.mark.asyncio
    async def test_get_display_404(self, async_client, auth_headers):
        """GET with nonexistent ID returns 404."""
        response = await async_client.get(
            "/api/displays/000000000000000000000000", headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_display(self, async_client, auth_headers, sample_display):
        """PUT /api/displays/{id} updates fields."""
        response = await async_client.put(
            f"/api/displays/{sample_display.id}",
            headers=auth_headers,
            json={"name": "Updated Name"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_delete_display(self, async_client, auth_headers, sample_display):
        """DELETE /api/displays/{id} returns 204."""
        response = await async_client.delete(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_delete_display_twice_404(self, async_client, auth_headers, sample_display):
        """DELETE on already-deleted display returns 404."""
        await async_client.delete(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        response = await async_client.delete(
            f"/api/displays/{sample_display.id}", headers=auth_headers
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_protected_endpoint_without_token(self, async_client):
        """No token → 401."""
        response = await async_client.get("/api/displays")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_search_and_filter(self, async_client, auth_headers, sample_display):
        """Search and filter query parameters work."""
        response = await async_client.get(
            "/api/displays?search=Test&status=ACTIVE&page=1&limit=5",
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert len(response.json()["data"]) >= 1
```

### `backend/tests/integration/test_bulk_upload_api.py`

```python
import pytest
from io import BytesIO
from openpyxl import Workbook

class TestBulkUploadAPI:
    """Spec §9.2 — Bulk upload endpoint tests."""

    @pytest.mark.asyncio
    async def test_download_template(self, async_client, auth_headers):
        """GET /template downloads .xlsx file."""
        response = await async_client.get(
            "/api/displays/bulk-upload/template", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == \
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert len(response.content) > 0

    @pytest.mark.asyncio
    async def test_validate_valid_file(self, async_client, auth_headers):
        """POST /validate with valid Excel returns is_valid=true."""
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
        """POST /validate with bad data returns is_valid=false with errors."""
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
        """Non-xlsx file returns 422."""
        response = await async_client.post(
            "/api/displays/bulk-upload/validate",
            headers=auth_headers,
            files={"file": ("test.csv", b"a,b,c", "text/csv")},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_commit_valid_preview(self, async_client, auth_headers):
        """POST /commit with valid rows returns stats report."""
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
```

---

## 8.5 Redux State Management Tests (spec §9.3)

> Using Vitest (bundled with Vite) or Jest.

### `frontend/src/redux/slices/__tests__/authSlice.test.js`

```js
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  loginAdmin, logoutAdmin,
  clearAuthError,
} from '../authSlice';

// Mock authService
jest.mock('../../../services/authService', () => ({
  authService: {
    login: jest.fn(),
  },
}));

const { authService } = require('../../../services/authService');

describe('authSlice', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = configureStore({
      reducer: { auth: authReducer },
    });
  });

  test('initial state', () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('loginAdmin.pending sets loading', () => {
    store.dispatch(loginAdmin.pending());
    const state = store.getState().auth;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });

  test('loginAdmin.fulfilled sets token and auth', () => {
    const fakeToken = 'fake-jwt-token';
    store.dispatch(loginAdmin.fulfilled({
      access_token: fakeToken,
      token_type: 'bearer',
      expires_at: '2026-07-22T14:23:14Z',
    }));
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe(fakeToken);
    expect(state.loading).toBe(false);
  });

  test('loginAdmin.rejected sets error', () => {
    store.dispatch(loginAdmin.rejected({
      payload: 'Invalid credentials',
    }));
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe('Invalid credentials');
    expect(state.loading).toBe(false);
  });

  test('logoutAdmin clears auth state', () => {
    // First login
    store.dispatch(loginAdmin.fulfilled({
      access_token: 'token', token_type: 'bearer', expires_at: '2026-07-22T14:23:14Z',
    }));
    // Then logout
    store.dispatch(logoutAdmin.fulfilled());
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  test('clearAuthError clears error', () => {
    store.dispatch(loginAdmin.rejected({ payload: 'Error' }));
    store.dispatch(clearAuthError());
    expect(store.getState().auth.error).toBeNull();
  });
});
```

### `frontend/src/redux/slices/__tests__/displaySlice.test.js`

```js
import { configureStore } from '@reduxjs/toolkit';
import displayReducer, {
  fetchDisplays, createDisplay, updateDisplay, deleteDisplay,
  setSearchQuery, setStatusFilter, setCurrentPage,
} from '../displaySlice';

// Mock api
jest.mock('../../../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const api = require('../../../services/api').default;

describe('displaySlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { displays: displayReducer },
    });
  });

  test('initial state', () => {
    const state = store.getState().displays;
    expect(state.items).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.currentPage).toBe(1);
    expect(state.loading).toBe(false);
    expect(state.selectedDisplay).toBeNull();
  });

  test('setSearchQuery resets page to 1', () => {
    store.dispatch(setCurrentPage(3));
    store.dispatch(setSearchQuery('lobby'));
    const state = store.getState().displays;
    expect(state.searchQuery).toBe('lobby');
    expect(state.currentPage).toBe(1);
  });

  test('setStatusFilter resets page to 1', () => {
    store.dispatch(setCurrentPage(2));
    store.dispatch(setStatusFilter('ACTIVE'));
    expect(store.getState().displays.statusFilter).toBe('ACTIVE');
    expect(store.getState().displays.currentPage).toBe(1);
  });

  test('fetchDisplays.fulfilled updates items and total', () => {
    const payload = {
      data: [{ id: '1', name: 'Test' }],
      pagination: { total: 1, page: 1, limit: 10, pages: 1 },
    };
    store.dispatch(fetchDisplays.fulfilled(payload));
    const state = store.getState().displays;
    expect(state.items).toHaveLength(1);
    expect(state.total).toBe(1);
    expect(state.loading).toBe(false);
  });

  test('deleteDisplay.fulfilled removes item', () => {
    store.dispatch(fetchDisplays.fulfilled({
      data: [{ id: '1', name: 'A' }, { id: '2', name: 'B' }],
      pagination: { total: 2, page: 1, limit: 10, pages: 1 },
    }));
    store.dispatch(deleteDisplay.fulfilled('1'));
    expect(store.getState().displays.items).toHaveLength(1);
    expect(store.getState().displays.total).toBe(1);
  });
});
```

### `frontend/src/redux/slices/__tests__/uploadSlice.test.js`

```js
import { configureStore } from '@reduxjs/toolkit';
import uploadReducer, {
  validateExcelFile, commitBulkUpload, clearUploadState,
} from '../uploadSlice';

jest.mock('../../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
}));

describe('uploadSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { upload: uploadReducer },
    });
  });

  test('initial state', () => {
    const state = store.getState().upload;
    expect(state.previewData).toEqual([]);
    expect(state.isValidating).toBe(false);
    expect(state.isCommitting).toBe(false);
  });

  test('validateExcelFile.pending sets isValidating', () => {
    store.dispatch(validateExcelFile.pending());
    expect(store.getState().upload.isValidating).toBe(true);
  });

  test('validateExcelFile.fulfilled sets preview and summary', () => {
    const payload = {
      is_valid: true,
      summary: { total_rows: 5, valid_rows: 5, failed_rows: 0 },
      preview: [{ row_number: 2, is_valid: true }],
    };
    store.dispatch(validateExcelFile.fulfilled(payload));
    const state = store.getState().upload;
    expect(state.isValidating).toBe(false);
    expect(state.previewData).toEqual(payload.preview);
    expect(state.validationSummary).toEqual(payload.summary);
  });

  test('commitBulkUpload.fulfilled sets commitResult', () => {
    const payload = { inserted: 5, failed: 0, total: 5, errors: [] };
    store.dispatch(commitBulkUpload.fulfilled(payload));
    expect(store.getState().upload.commitResult).toEqual(payload);
    expect(store.getState().upload.isCommitting).toBe(false);
  });

  test('clearUploadState resets all upload state', () => {
    store.dispatch(validateExcelFile.fulfilled({
      preview: [{}], summary: { total_rows: 1, valid_rows: 1, failed_rows: 0 },
    }));
    store.dispatch(clearUploadState());
    const state = store.getState().upload;
    expect(state.previewData).toEqual([]);
    expect(state.validationSummary).toBeNull();
  });
});
```

---

## 8.6 UI Tests (spec §9.4)

> Using Vitest + React Testing Library.

### `frontend/src/components/common/__tests__/ProtectedRoute.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../redux/slices/authSlice';
import ProtectedRoute from '../ProtectedRoute';

const renderWithAuth = (isAuthenticated, initialRoute = '/') => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { isAuthenticated, token: isAuthenticated ? 'token' : null } },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    </Provider>
  );
};

test('renders children when authenticated', () => {
  renderWithAuth(true);
  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});

test('redirects to /login when not authenticated', () => {
  renderWithAuth(false, '/displays');
  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  // Should redirect — check that login page would render
});
```

### `frontend/src/components/displays/__tests__/DisplayTable.test.jsx`

```jsx
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import DisplayTable from '../DisplayTable';

const mockItems = [
  {
    id: '1', display_id: 'DSP-001', name: 'Main Entrance',
    ip_address: '192.168.1.50', location: 'Floor 1',
    status: 'ACTIVE',
  },
  {
    id: '2', display_id: 'DSP-002', name: 'Exit Sign',
    ip_address: '192.168.1.51', location: 'Floor 2',
    status: 'INACTIVE',
  },
];

test('renders table rows', () => {
  render(
    <ThemeProvider theme={createTheme()}>
      <DisplayTable items={mockItems} onEdit={() => {}} onDelete={() => {}} />
    </ThemeProvider>
  );
  expect(screen.getByText('DSP-001')).toBeInTheDocument();
  expect(screen.getByText('Main Entrance')).toBeInTheDocument();
  expect(screen.getByText('ACTIVE')).toBeInTheDocument();
});

test('shows skeletons when loading with no items', () => {
  const { container } = render(
    <ThemeProvider theme={createTheme()}>
      <DisplayTable items={[]} loading={true} onEdit={() => {}} onDelete={() => {}} />
    </ThemeProvider>
  );
  // MUI Skeleton renders span elements
  expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
});
```

---

## 8.7 Running Tests

### Backend (pytest)

```bash
# From backend/ directory:
pytest tests/ -v --cov=app --cov-report=term-missing

# Run specific test file:
pytest tests/unit/test_excel_parser.py -v

# Run integration tests only:
pytest tests/integration/ -v

# With coverage threshold:
pytest --cov=app --cov-fail-under=80
```

### Frontend (Vitest)

```bash
# From frontend/ directory:
npx vitest run --coverage

# Watch mode:
npx vitest

# Specific test file:
npx vitest src/redux/slices/__tests__/authSlice.test.js
```

### Test targets from spec §9

| Test Tier | Tool | Target Coverage | # Tests Expected |
|-----------|------|----------------|-----------------|
| Unit: Excel parsing | pytest | 90% of excel_parser.py | 8–10 |
| Unit: Password hashing | pytest | 100% of security.py | 5–6 |
| Unit: JWT | pytest | 100% of jwt helpers | 3–4 |
| Integration: Auth flow | pytest + httpx | All login scenarios | 3–5 |
| Integration: CRUD | pytest + httpx | All endpoints, all status codes | 8–12 |
| Integration: Bulk upload | pytest + httpx | Validate + commit flows | 5–7 |
| Redux: authSlice | vitest | All states (pending/fulfilled/rejected) | 6–8 |
| Redux: displaySlice | vitest | All thunks + reducers | 8–10 |
| Redux: uploadSlice | vitest | Validate + commit flows | 4–6 |
| UI: ProtectedRoute | RTL + vitest | Auth guard behavior | 2 |
| UI: DisplayTable | RTL + vitest | Render states | 2–3 |
| UI: UploadPreviewTable | RTL + vitest | Error highlights — verify red bg, tooltip on hover shows error message, "exact lines, showing inline errors" (spec §9) | 2–3 |
| **Total** | | **~80% overall** | **56–76 tests** |

---

## Verification Checklist

- [ ] `pytest tests/unit/ -v` — all unit tests pass
- [ ] `pytest tests/integration/ -v` — all integration tests pass
- [ ] `pytest --cov=app --cov-fail-under=80` — coverage ≥ 80%
- [ ] `npx vitest run` — all frontend tests pass
- [ ] `npx vitest run --coverage` — frontend coverage report generated
- [ ] Auth tests: login success, wrong password, wrong username
- [ ] CRUD tests: create, read, update, delete, search, filter, pagination
- [ ] CRUD tests: duplicate ID → 400, not found → 404, no auth → 401
- [ ] Upload tests: template download, valid file, invalid file, commit
- [ ] Redux tests: each slice's initial state, pending/fulfilled/rejected, reducers
- [ ] UI tests: ProtectedRoute redirect, DisplayTable render & skeleton

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `test-runner` | Write all test files, run suite, fix failures, verify coverage ≥ 80%. Use `pytest --tb=short` for clean failure output |
| `reviewer` | Verify test coverage matrix matches spec §9 exactly. Check that edge cases (empty states, duplicate detection, file size limits) are covered |
| `refactoring-expert` | After tests pass: identify untestable code patterns and suggest refactoring for testability (e.g., extract pure functions from service layers) |
