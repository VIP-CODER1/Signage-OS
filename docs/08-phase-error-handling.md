# Phase 7: Error Handling & Recovery

> **Effort:** 6–8 hours (max) | **Depends on:** Phase 6 (Frontend Pages) | **Agent:** reviewer

---

## Objective

Implement systematic error handling across the entire stack matching spec §7 Failure Scenarios & Error Recovery Matrix. Backend: structured error responses, global exception handlers. Frontend: ErrorBoundary, per-page error states, recovery actions, retry logic.

> **Spec reference:** §7 (Failure Scenarios & Error Recovery Matrix), §5.3 (UI error states)

---

## 7.1 Backend: Global Exception Handler — `backend/app/core/error_handlers.py`

```python
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.core.logger import logger

async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions — return 500 with trace ID."""
    error_id = str(uuid.uuid4())[:8]
    logger.error(f"Unhandled exception [{error_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "error_id": error_id,
        },
    )

async def http_exception_handler(request: Request, exc: HTTPException):
    """Standard HTTP exceptions — log 5xx, pass through 4xx."""
    if exc.status_code >= 500:
        logger.error(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# Wire in main.py:
# app.add_exception_handler(Exception, global_exception_handler)
# app.add_exception_handler(HTTPException, http_exception_handler)
```

---

## 7.2 Backend: Structured Error Responses

All error responses follow the same shape throughout the API:

```json
{
  "detail": "Human-readable error message",
  "error_id": "a1b2c3d4"       // optional, present on 5xx
  "errors": [                    // optional, present for validation failures
    { "field": "display_id", "message": "Duplicate display_id" }
  ]
}
```

### Error Response Schemas — `backend/app/schemas/error.py`

```python
from pydantic import BaseModel
from typing import List, Optional

class FieldError(BaseModel):
    field: str
    message: str

class ErrorResponse(BaseModel):
    detail: str
    error_id: Optional[str] = None
    errors: Optional[List[FieldError]] = None
```

### Validation Exception — `backend/app/core/exceptions.py`

```python
from typing import List, Optional

class AppException(Exception):
    def __init__(self, detail: str, status_code: int = 400,
                 errors: Optional[List[dict]] = None):
        self.detail = detail
        self.status_code = status_code
        self.errors = errors or []

class DuplicateDisplayIdError(AppException):
    def __init__(self, display_id: str):
        super().__init__(
            detail=f"Display ID '{display_id}' already exists",
            status_code=400,
            errors=[{"field": "display_id", "message": "Display ID already exists"}],
        )

class DisplayNotFoundError(AppException):
    def __init__(self):
        super().__init__(detail="Display not found", status_code=404)

class ExcelParseError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=422)

class DatabaseTimeoutError(AppException):
    def __init__(self):
        super().__init__(
            detail="Database connection timeout",
            status_code=503,
        )
```

### Exception-to-HTTP Mapping

| Exception Class | HTTP Status | Example Scenario |
|----------------|-------------|------------------|
| `DuplicateDisplayIdError` | 400 | POST/PUT with existing display_id |
| `DisplayNotFoundError` | 404 | GET/DELETE with invalid ID |
| `ExcelParseError` | 422 | Missing column, wrong format, >10MB |
| `DatabaseTimeoutError` | 503 | MongoDB connection drop |
| `AppException` | 400+ | Generic business-rule violation |

---

## 7.3 Backend: Error Scenario Implementation (spec §7)

### Scenario 1: Invalid Credentials — 401

Already implemented in Phase 2 auth endpoints. Verify:

```python
# In auth.py login endpoint:
if not admin or not verify_password(request.password, admin.hashed_password):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
    )
```

### Scenario 2: Token Expired — 401

Already implemented in Phase 2 `deps.py`. Verify:

```python
# In deps.py get_current_admin:
if payload is None:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token expired",
    )
```

### Scenario 3: Duplicate Display ID — 400

Already implemented in Phase 3 service layer. Verify:

```python
# In display_service.py:
if existing:
    raise DuplicateDisplayIdError(data.display_id)
```

### Scenario 4: Excel Column Missing — 422

Already implemented in Phase 4 excel_parser.py:

```python
# In excel_parser.py:
if missing:
    raise ExcelParseError(f"Missing column(s): {', '.join(missing)}")
```

### Scenario 5: Cell Format/Type Mismatch — 422

Already implemented in Phase 4 excel_parser.py row-by-row validation:

```python
# In preview response — each failed row has errors list
"preview": [
    {
        "row_number": 3,
        "is_valid": false,
        "errors": [
            {"field": "ip_address", "message": "Invalid IP address format"},
            {"field": "status", "message": "Value must be ACTIVE, INACTIVE, or MAINTENANCE"}
        ]
    }
]
```

### Scenario 6: Database Outage — 503

**New implementation needed:**

```python
# In database.py — add connection health check
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.exceptions import DatabaseTimeoutError

async def check_db_health(client: AsyncIOMotorClient) -> bool:
    """Ping MongoDB — used by health endpoint and middleware."""
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False

# In main.py health endpoint:
@app.get("/api/health")
async def health_check():
    db_ok = await check_db_health()
    if not db_ok:
        raise HTTPException(status_code=503, detail="Database connection timeout")
    return {"status": "ok", "version": "1.0.0", "database": "connected"}
```

---

## 7.4 Frontend: ErrorBoundary — `frontend/src/components/common/ErrorBoundary.jsx`

> Catches render-time React errors, shows fallback UI instead of white screen.

```jsx
import { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={8}>
          <Typography variant="h5" gutterBottom>Something went wrong</Typography>
          <Typography color="text.secondary" mb={3}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
```

**Wire in `main.jsx`:**
```jsx
<ErrorBoundary>
  <Provider store={store}>
    ...
  </Provider>
</ErrorBoundary>
```

---

## 7.5 Frontend: Per-Spec Error State Implementation

### 7.5.1 Login — Invalid Credentials (spec §7)

```jsx
// Already implemented in LoginPage:
// When login fails — Redux state.error is set
// UI: MUI Alert above form: "Incorrect username or password"
// Fields stay filled, user can retry immediately

// Additional: highlight inputs in red with helper text
<TextField
  error={!!error}
  helperText={error === 'Incorrect username or password' ? 'Check credentials' : ''}
/>
```

### 7.5.2 Token Expired — redirect to login (spec §7)

```jsx
// Already implemented in api.js Axios interceptor:
// 401 response → clear localStorage → dispatch logout → redirect /login
// Add: info toast before redirect
const { enqueueSnackbar } = useSnackbar();
// or using NotificationProvider:
notify('Session expired. Please log in again.', 'info');
```

### 7.5.3 Duplicate Display ID — inline field error (spec §7)

```jsx
// In DisplayFormDialog:
// When server returns 400 with error on "display_id" field:
errors: [
  { field: "display_id", message: "Display ID already exists" }
]

// Handle in form submission:
const handleSubmit = async (data) => {
  try {
    const result = await dispatch(createDisplay(data)).unwrap();
    onSuccess(result);
  } catch (err) {
    if (err.errors) {
      err.errors.forEach(e => {
        setError(e.field, { type: 'server', message: e.message });
      });
    }
  }
};

// UI: React Hook Form shows red helper text under display_id field
```

### 7.5.4 Excel Column Missing — explicit error card (spec §7)

```jsx
// In BulkUploadPage:
// When 422 with "Missing column(s): display_id"
// Show elevated MUI Alert above FileDropzone:

<Alert severity="error" sx={{ mb: 2 }}>
  <AlertTitle>Invalid File Structure</AlertTitle>
  Missing columns: <strong>display_id, name</strong>
  <br />
  Please download the template and ensure all required columns are present.
</Alert>
```

### 7.5.5 Cell Format Mismatch — table highlights (spec §7)

```jsx
// In UploadPreviewTable:
// Each row gets background color based on is_valid:

<TableRow
  sx={{
    bgcolor: row.is_valid ? 'rgba(76, 175, 80, 0.08)' : 'rgba(211, 47, 47, 0.08)',
  }}
>
  {/* Error tooltip on hover for invalid cells: */}
  {row.errors.map(e => (
    <Tooltip key={e.field} title={e.message} arrow>
      <TableCell sx={{ borderBottom: '2px solid #d32f2f' }}>
        {row.data[e.field]}
      </TableCell>
    </Tooltip>
  ))}
</TableRow>
```

### 7.5.6 Database Outage — global error state (spec §7)

```jsx
// In Axios interceptor (api.js) — already has 503 retry logic:
// After 3 retries fail, propagate error to caller

// In each page's error state — show:
<Alert severity="warning" action={
  <Button onClick={retry}>Retry</Button>
}>
  Server is temporarily busy. Please try again later.
</Alert>
```

---

## 7.6 Spec §7 Error Recovery Matrix — Complete Map

| Scenario | HTTP | Backend Handler | Frontend State | Recovery |
|----------|------|-----------------|---------------|----------|
| Invalid Credentials | 401 | `auth.py` — raise 401 | Alert on login form | Re-enter credentials |
| Token Expired | 401 | `deps.py` — raise 401 | Redirect /login + info toast | Re-login |
| Duplicate Display ID | 400 | `DuplicateDisplayIdError` | Inline error on display_id field | Choose different ID |
| Excel Column Missing | 422 | `ExcelParseError` | ErrorAlert above dropzone | Re-download template |
| Cell Format Mismatch | 422 | Row-level validation errors | Red table rows + tooltips | Download failed rows |
| DB Outage | 503 | `DatabaseTimeoutError` | WarningAlert + Retry button | Retry (3 attempts) |
| Display Not Found | 404 | `DisplayNotFoundError` | "Not found" page + Back button | Navigate to list |
| Generic 500 | 500 | `global_exception_handler` | ErrorBoundary fallback | Reload page |
| Network Offline | — | — | Offline banner (navigator.onLine) | Wait for connection |

---

## 7.7 Frontend: Offline Detection

```jsx
// frontend/src/components/common/OfflineBanner.jsx
import { useState, useEffect } from 'react';
import { Alert } from '@mui/material';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <Alert severity="warning" sx={{ borderRadius: 0 }}>
      You are offline. Some features may be unavailable.
    </Alert>
  );
}
```

---

## Verification Checklist

### Backend Error Handling
- [ ] 400 Duplicate ID returns `{"detail": "...", "errors": [{"field": "display_id", "message": "..."}]}`
- [ ] 401 Invalid credentials returns `{"detail": "Incorrect username or password"}`
- [ ] 401 Expired token returns `{"detail": "Token expired"}`
- [ ] 404 Display not found returns `{"detail": "Display not found"}`
- [ ] 422 Missing Excel columns returns explicit column names in detail
- [ ] 422 Invalid Excel returns row-by-row errors in preview
- [ ] 503 DB outage returns `{"detail": "Database connection timeout"}`
- [ ] 500 unhandled error returns `{"detail": "An unexpected error occurred", "error_id": "..."}`
- [ ] All 5xx errors are logged with stack trace and error_id

### Frontend Error States
- [ ] Login: 401 → Alert with error message + inputs highlighted
- [ ] Token expired → redirect to /login with info toast
- [ ] Duplicate ID → inline error on display_id field in DisplayFormDialog
- [ ] Excel missing columns → ErrorAlert above dropzone
- [ ] Excel cell errors → UploadPreviewTable shows red rows with tooltips
- [ ] DB outage (503) → WarningAlert with Retry button after 3 retries
- [ ] Display not found (404) → dedicated error state with back navigation
- [ ] Generic 500 → ErrorBoundary fallback UI with reload button
- [ ] Network offline → OfflineBanner at top of page

### Recovery
- [ ] Axios 401 interceptor clears auth and redirects
- [ ] Axios 503 retry: 3 attempts with exponential backoff
- [ ] ErrorBoundary catches React render errors without white screen
- [ ] Retry buttons re-dispatch the failed API call
- [ ] OfflineBanner auto-dismisses when connection returns

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `reviewer` | Verify every error scenario in spec §7 matrix is implemented. Check that frontend error states match the "User-Facing Action / UI State" column exactly. Ensure error response shapes are consistent across all endpoints |
| `security-auditor` | Verify 5xx error responses don't leak stack traces, DB details, or internal paths. error_id should not reveal internal state |
| `test-runner` | (Deferred to Phase 8 — write integration tests for each error scenario) |
