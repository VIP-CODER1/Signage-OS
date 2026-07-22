# Phase 6: Frontend Pages & Components

> **Effort:** 12–16 hours (max) | **Depends on:** Phase 5 (Frontend Arch & Redux) | **Agent:** reviewer

---

## Objective

Build all UI pages: login, display list with search/filter, display detail/edit, and bulk upload wizard. Every page uses MUI v5 components, React Hook Form for validation, and dispatches Redux thunks from Phase 5.

> **Spec reference:** §5.2, §5.3, §6.3

---

## UI Plan (ui-planner methodology)

### User Job
**Primary user:** Signage administrator. They need to manage digital displays across a physical venue — add new displays, update locations/IPs, change status for maintenance, and bulk-import many displays at once via Excel. The admin logs in once per session (8hr token) and performs CRUD operations throughout the day.

### Information Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        APP                               │
├──────────────────────────────────────────────────────────┤
│  ┌─ Public ───────────────────────────────────────────┐  │
│  │  /login → LoginPage                                │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Protected (JWT required) ─────────────────────────┐  │
│  │  /displays                                          │  │
│  │    ├── DisplaysPage (table + search + pagination)   │  │
│  │    │   ├── SearchBar                                │  │
│  │    │   ├── StatusFilter (dropdown)                  │  │
│  │    │   ├── DisplayTable                             │  │
│  │    │   ├── DisplayFormDialog (add/edit modal)       │  │
│  │    │   └── ConfirmDeleteDialog                      │  │
│  │    │                                                │  │
│  │    ├── /displays/:id → DisplayDetailPage            │  │
│  │    │   ├── DisplayCard (read-only view)             │  │
│  │    │   └── DisplayForm (inline edit)                │  │
│  │    │                                                │  │
│  │    └── /displays/upload → BulkUploadPage            │  │
│  │        ├── FileDropzone                             │  │
│  │        ├── UploadPreviewTable                       │  │
│  │        └── UploadSummaryPanel                       │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Global (every page when authenticated) ──────────┐  │
│  │  Navbar (app bar with nav links + logout)          │  │
│  │  NotificationProvider (snackbar toasts)            │  │
│  │  OfflineBanner (connection status)                 │  │
│  │  ErrorBoundary (React crash fallback)              │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### Page: LoginPage
| Component | Type | Props | State Owner |
|-----------|------|-------|-------------|
| `LoginPage` | New | none | React state: `username`, `password` |
| `Alert` | MUI reused | `severity`, `children` | Redux: `auth.error` |
| `TextField` | MUI reused | `label`, `value`, `onChange` | React state |
| `Button` | MUI reused | `disabled`, `onClick` | Redux: `auth.loading` |

#### Page: DisplaysPage
| Component | Type | Props | State Owner |
|-----------|------|-------|-------------|
| `DisplaysPage` | New | none | Redux: `displays.*`, local: `dialogOpen`, `editingDisplay`, `deleteTarget` |
| `SearchBar` | New | `value`, `onChange` | Redux: `displays.searchQuery` |
| `StatusFilter` | New (inline) | `value`, `onChange` | Redux: `displays.statusFilter` |
| `DisplayTable` | New | `items`, `loading`, `onEdit`, `onDelete` | Redux: `displays.items` |
| `DisplayFormDialog` | New | `open`, `display` (null=create), `onSave`, `onCancel` | Local component state (react-hook-form) |
| `ConfirmDeleteDialog` | New | `open`, `displayName`, `onConfirm`, `onCancel` | Local: `deleteTarget` state in parent |
| `Pagination` | MUI reused | `page`, `count`, `onChange` | Redux: `displays.currentPage`, `total` |
| `Skeleton` | MUI reused | — | Shown when `loading && !items.length` |

#### Page: DisplayDetailPage
| Component | Type | Props | State Owner |
|-----------|------|-------|-------------|
| `DisplayDetailPage` | New | none | Redux: `displays.selectedDisplay`, local: `isEditing` |
| `DisplayCard` | New | `display` | Renders from Redux data |
| `DisplayForm` | New | `display`, `onSave`, `onCancel` | Local: react-hook-form |
| `ConfirmDeleteDialog` | Reused | `open`, `displayName`, `onConfirm`, `onCancel` | Local: `showDeleteConfirm` |

#### Page: BulkUploadPage
| Component | Type | Props | State Owner |
|-----------|------|-------|-------------|
| `BulkUploadPage` | New | none | Redux: `upload.*`, local: `step`, `selectedFile` |
| `FileDropzone` | New | `onFileSelect`, `accept`, `error` | Local: drag state, file state |
| `UploadPreviewTable` | New | `rows` (preview array) | Redux: `upload.previewData` |
| `UploadSummaryPanel` | New | `summary`, `onCommit`, `onDownloadFailed`, `hasValidRows`, `isCommitting` | Redux: `upload.validationSummary` |
| `LinearProgress` | MUI reused | — | Redux: `upload.isValidating` |

#### Global Components
| Component | Type | Props | State Owner |
|-----------|------|-------|-------------|
| `Navbar` | New | none | Redux: `auth.token` (show/hide) |
| `NotificationProvider` | New | `children` | Local context: message queue |
| `ErrorBoundary` | New | `children` | Local: `hasError` (React lifecycle) |
| `OfflineBanner` | New | none | Local: `navigator.onLine` event |
| `ProtectedRoute` | New | `children` | Redux: `auth.isAuthenticated` |

### State Shape — Complete Map

```
State Source         │ Data                                 │ Used By
─────────────────────┼──────────────────────────────────────┼─────────────────────
Redux: auth          │ token, isAuthenticated, loading, err │ Navbar, ProtectedRoute, LoginPage, api.js
Redux: displays      │ items, total, currentPage, limit,    │ DisplaysPage, DisplayTable, Pagination
                     │ searchQuery, statusFilter, selected  │ DisplayDetailPage, DisplayFormDialog
                     │ Display, loading, error              │
Redux: upload        │ previewData, validationSummary,      │ BulkUploadPage, FileDropzone,
                     │ isValidating, isCommitting,          │ UploadPreviewTable, UploadSummaryPanel
                     │ uploadError, commitResult            │
URL (route params)   │ /displays/:id → id                  │ DisplayDetailPage (fetch by id)
URL (query params)   │ ?page=&search=&status=              │ (via Redux setters → useEffect → fetch)
Local (React state)  │ username, password                   │ LoginPage
                     │ dialogOpen, editingDisplay           │ DisplaysPage
                     │ deleteTarget                         │ DisplaysPage, DisplayDetailPage
                     │ isEditing                            │ DisplayDetailPage
                     │ step, selectedFile                   │ BulkUploadPage
                     │ form values (react-hook-form)        │ DisplayFormDialog, DisplayForm
Context (React)      │ notify(message, severity)            │ All pages (via useNotification)
```

### Interaction Flows

#### Flow 1: Login
```
User action                         │ System response                        │ Failure path
────────────────────────────────────┼────────────────────────────────────────┼───────────────────────────
1. Navigates to /login              │ Shows centered form                    │ —
2. Types username + password        │ Client-side validation on blur         │ Shows inline "Required"
3. Clicks Sign In                   │ Redux: loginAdmin.pending              │ —
4. (during API call)                │ Button shows spinner, fields disabled  │ —
5a. 200 OK                          │ Redux: fulfilled → token in localStorage│ —
                                    │ → redirect to /displays                │
5b. 401 Unauthorized                │ Redux: rejected → error set            │ Red alert: "Incorrect username
                                    │                                        │ or password", fields editable
5c. Network error                   │ Redux: rejected → "Login failed"       │ Red alert: "Login failed"
```

#### Flow 2: List → Create Display
```
User action                         │ System response                        │ Failure path
────────────────────────────────────┼────────────────────────────────────────┼───────────────────────────
1. On /displays, clicks [+ Add]     │ Opens DisplayFormDialog (empty)         │ —
2. Fills form, clicks Save          │ Client-side validation                 │ Inline errors under fields
3. Submit                           │ API: POST /api/displays                │ —
4a. 201 Created                     │ Dialog closes, list refreshes          │ —
                                    │ Snackbar: "Display created"            │
4b. 400 Duplicate ID                │ —                                      │ Inline error on display_id field:
                                    │                                        │ "Display ID already exists"
4c. 422 Validation error            │ —                                      │ Inline errors on relevant fields
```

#### Flow 3: List → Edit Display
```
User action                         │ System response                        │ Failure path
────────────────────────────────────┼────────────────────────────────────────┼───────────────────────────
1. Clicks [✏️] on a row             │ Opens DisplayFormDialog (pre-filled)   │ —
2. Modifies fields, clicks Save     │ PUT /api/displays/{id}                 │ Same as create failures
3a. 200 OK                          │ Dialog closes, row updates in table    │ —
                                    │ Snackbar: "Display updated"            │
```

#### Flow 4: List → Delete Display
```
User action                         │ System response                        │ Failure path
────────────────────────────────────┼────────────────────────────────────────┼───────────────────────────
1. Clicks [🗑] on a row             │ Opens ConfirmDeleteDialog               │ —
2. Clicks Cancel                    │ Dialog closes, nothing happens         │ —
3. Clicks Confirm Delete            │ DELETE /api/displays/{id}              │ —
4a. 204 No Content                  │ Row removed from list, total decrements│ —
                                    │ Snackbar: "Display deleted"            │
4b. 404 Not Found                   │ —                                      │ Snackbar: "Display not found"
4c. Network error                   │ —                                      │ Snackbar: "Failed to delete"
```

#### Flow 5: Search + Filter
```
User action                         │ System response                        │ Failure path
────────────────────────────────────┼────────────────────────────────────────┼───────────────────────────
1. Types in SearchBar               │ 300ms debounce                         │ —
2. Debounce fires                   │ Redux: setSearchQuery → page resets to 1│ —
                                    │ useEffect fires fetchDisplays()        │
3. Selects status from dropdown     │ Redux: setStatusFilter → page resets   │ —
                                    │ useEffect fires fetchDisplays()        │
4a. Results returned                │ DisplayTable updates                   │ —
4b. No results                      │ EmptyState: "No displays match"        │ —
4c. 500/503 error                   │ —                                      │ ErrorAlert with retry
```

#### Flow 6: Bulk Upload (complete wizard)
```
User action                         │ System response                        │ Failure path
────────────────────────────────────┼────────────────────────────────────────┼───────────────────────────
1. On /displays/upload              │ Step 0: Info card + Download button    │ —
2. Clicks Download Template         │ GET template → browser downloads .xlsx │ Snackbar: "Download failed"
3. Selects .xlsx file in dropzone   │ Step 1: File selected, Validate btn    │ Client error if not .xlsx
                                    │ enabled                                │
4. Clicks Validate                  │ POST /validate → preview returned      │ —
5a. Valid rows                      │ Step 2: green badge, commit btn active │ —
5b. Invalid rows                    │ Step 2: red badge, error table visible │ —
                                    │ "Download Failed Rows" btn visible     │
6. Clicks Commit                    │ POST /commit → stats returned          │ —
7a. All succeeded                   │ Step 3: green success banner           │ —
7b. Partial success                 │ Step 3: amber warning with details     │ —
7c. API error                       │ Step 3: red error alert                │ Retry button
8. "Upload Another"                 │ Reset to Step 0                        │ —
```

#### Flow 7: Token Expiry (global)
```
User action                         │ System response                        │ Failure path
────────────────────────────────────┼────────────────────────────────────────┼───────────────────────────
1. Any API call with expired token  │ Backend: 401                           │ —
2. Axios interceptor catches 401    │ Clears localStorage, dispatches logout │ —
3. Redirect to /login               │ Info toast: "Session expired"          │ —
```

### Accessibility (a11y) Plan

| Requirement | Implementation |
|-------------|---------------|
| **Semantic HTML** | Use `<nav>` for Navbar, `<main>` for page content, `<button>` not `<div>` for clickable elements |
| **Form labels** | All MUI TextFields have `label` prop → auto-generates `<label>` + `aria-labelledby` |
| **Keyboard navigation** | Tab order: form fields → buttons → links. Escape closes all dialogs. Enter submits forms. |
| **Focus management** | On dialog open, first input receives focus. On dialog close, focus returns to trigger button. On route change, focus moves to `<main>` heading. |
| **ARIA** | `aria-busy="true"` on loading tables. `aria-live="polite"` on snackbar. `role="alert"` on error messages. `aria-describedby` on ConfirmDialog. |
| **Color contrast** | WCAG AA: StatusChip colors checked (green #2e7d32 on white = 3.0:1 minimum for large text, adjust if needed). Error red #d32f2f = 4.5:1+ on white bg. |
| **Reduced motion** | Check: `@media (prefers-reduced-motion: reduce)` — disable skeleton animation, dialog transitions |
| **Touch targets** | All buttons/IconButtons ≥ 44×44px. Table rows have min-height for tap. |
| **Screen reader** | Snackbar uses `role="status"`. Table has `aria-label`. Sort/filter announcements via `aria-live`. |

### Responsive Behavior — Detailed

| Breakpoint | LoginPage | DisplaysPage | DisplayDetailPage | BulkUploadPage |
|------------|-----------|-------------|-------------------|---------------|
| **xs: 0–600px** | Card width: 90vw, max 360px | Table → stacked Card list (DisplayCard), SearchBar full width, FAB for Add | Card full width, no side padding | Stack everything vertically, FileDropzone full width |
| **sm: 600–900px** | Card width: 400px | Table with horizontal scroll, SearchBar 60%, filters inline | Card max-width 600px centered | FileDropzone 60%, preview table scrolls |
| **md: 900–1200px** | Same | Full table, filters in toolbar row | Side-by-side detail layout | Multi-column: dropzone + summary side by side |
| **lg: 1200px+** | Same | Full table with max-width 1200px container | Max-width 1000px container | Max-width 1200px, full layout |

#### Mobile-specific adaptations:
- **Navbar:** Hamburger menu on xs (MUI Drawer) instead of inline nav links
- **DisplaysPage:** Replace DisplayTable with `<DisplayCard>` list — each card shows ID, name, location, status chip, and action buttons
- **DisplayFormDialog:** Full-screen dialog on xs (MUI `<Dialog fullScreen>`)
- **BulkUploadPage:** UploadPreviewTable collapses to accordion sections per row

### Edge Cases Checklist

| Edge Case | Handling |
|-----------|----------|
| **Very long display name (100 chars)** | CSS `text-overflow: ellipsis` on table cells, full value shown in tooltip on hover |
| **Very long location (150 chars)** | Same ellipsis strategy |
| **Very long IP list** | Single IP per display, no overflow concern |
| **Zero displays** | EmptyState: illustration + "Add your first display" CTA |
| **One display** | Table renders single row correctly, pagination shows "Page 1 of 1" |
| **10,000 displays (max)** | Pagination works: 1000 pages at 10/page. API enforces max limit 100. |
| **Search with no results** | EmptyState: "No displays match" + clear filters button |
| **Search exactly 1 result** | Table shows single row, pagination: Page 1 of 1 |
| **IP address with leading zeros** | String field — preserved as entered |
| **Excel with 10,000 rows** | Backend limit enforced, preview returns all with green/red highlighting |
| **Excel with only header row** | Validation returns is_valid=true, 0 rows, commit does nothing |
| **Excel with all rows failed** | Validation shows all red, commit button disabled |
| **File selected but not yet validated** | "Validate" button enabled, "Upload another" clears selection |
| **Slow network (3G)** | Skeletons (not spinners) for known table layouts. Progress bars for upload. |
| **Offline** | OfflineBanner at top. All API calls fail gracefully with "You appear offline" message. |
| **Browser back button** | Works naturally via React Router. `/displays/:id` → back → `/displays` with cached list. |
| **Direct URL access** | ProtectedRoute checks auth → redirects to /login → return-to after login |
| **Rapid double-click Save** | Button disabled during loading, form fields disabled |
| **Tab close mid-upload** | No recovery — backend did not commit yet. User re-uploads. |
| **Token expires mid-edit** | 401 on save → interceptor redirects to /login → return-to after login → form was local state, lost (acceptable) |
| **Concurrent admin (multitenant)** | Not required for this app (single admin) |
| **RTL language** | Not required for initial version |

---

## Plan: Frontend UI Implementation (planning skill)

### Goal
Build all 4 pages + global components with complete state coverage (loading, empty, error, success) following the UI plan above.

### Surface area
- `frontend/src/pages/` — 4 page components
- `frontend/src/components/common/` — 8 shared components
- `frontend/src/components/displays/` — 5 display-specific components
- `frontend/src/utils/validators.js` — client validation
- `frontend/src/App.jsx` — router updates
- `frontend/src/main.jsx` — ErrorBoundary + NotificationProvider wiring

### Constraints
- All components must use MUI v5 (no custom CSS beyond sx props)
- Every async operation must show loading/error/success states
- React Hook Form for all forms (no manual form state)
- Components must be functional + hooks (no class components except ErrorBoundary)

### Chosen approach
Bottom-up component build: common → display-specific → pages → global wiring. Each step is independently testable and mergeable.

### Steps

1. **Common components** (~1.5 hrs)
   - Files: `ProtectedRoute`, `Navbar`, `LoadingSpinner`, `EmptyState`, `ErrorAlert`, `ConfirmDeleteDialog`, `StatusChip`, `SearchBar`, `ErrorBoundary`, `OfflineBanner`, `NotificationProvider`
   - Verify: Each renders in isolation, props work, MUI theme applies
   - Rollback: Revert any component

2. **Display components** (~1.5 hrs)
   - Files: `DisplayTable`, `DisplayFormDialog`, `DisplayCard`, `DisplayForm`, `BulkUploadPreview`
   - Verify: Table renders sample data, Dialog opens/closes, form validates
   - Rollback: Revert component directory

3. **Page: LoginPage** (~0.5 hr)
   - Files: `LoginPage.jsx`
   - Verify: Renders form, dispatches login, error shows, redirect on success
   - Rollback: Revert single file

4. **Page: DisplaysPage** (~1.5 hrs)
   - Files: `DisplaysPage.jsx`
   - Verify: Table with data, search debounces, filter works, pagination works, empty/error states, create/edit/delete dialogs
   - Rollback: Revert single file

5. **Page: DisplayDetailPage** (~1 hr)
   - Files: `DisplayDetailPage.jsx`
   - Verify: Loads by id, displays card, edit toggles form, save works, 404 handled
   - Rollback: Revert single file

6. **Page: BulkUploadPage** (~2 hrs)
   - Files: `BulkUploadPage.jsx`, `FileDropzone.jsx`, `UploadPreviewTable.jsx`, `UploadSummaryPanel.jsx`
   - Verify: 4-step wizard, file validation, preview table, commit, error states
   - Rollback: Revert page + new components

7. **Global wiring** (~0.5 hr)
   - Files: `App.jsx`, `main.jsx`, `App.jsx` (router)
   - Verify: ErrorBoundary wraps app, NotificationProvider works, Navbar shows/hides, all routes work
   - Rollback: Revert wiring files

### Risks
- **Risk:** MUI DataGrid license (community vs enterprise) → **Mitigation:** Use MUI Table instead of DataGrid. Falls back gracefully.
- **Risk:** React Hook Form + MUI integration issues → **Mitigation:** Use MUI's `TextField` with RHF's `register()` — well-documented pattern.
- **Risk:** File dropzone cross-browser issues → **Mitigation:** Use native `<input type="file">` with styled overlay; dropzone is progressive enhancement.

### Done when
- All 4 pages render at xs/sm/md+ breakpoints
- Every page has verified loading, empty, error, and success states
- All interaction flows (1–7 above) pass manual testing
- `npm run dev` starts without errors
- Lighthouse audit: Performance ≥ 80, Accessibility ≥ 90

---

## 6.1 Common Components — `frontend/src/components/common/`

### ProtectedRoute — `frontend/src/components/common/ProtectedRoute.jsx`

```jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
```

### Navbar — `frontend/src/components/common/Navbar.jsx`

```jsx
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutAdmin } from '../../redux/slices/authSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);

  if (!token) return null;

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/displays')}>
          Signage Manager
        </Typography>
        <Box>
          <Button color="inherit" onClick={() => navigate('/displays')}>Displays</Button>
          <Button color="inherit" onClick={() => navigate('/displays/upload')}>Bulk Upload</Button>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
```

#### Additional Common Components to Create

| Component | File | Purpose |
|-----------|------|---------|
| `LoadingSpinner` | `LoadingSpinner.jsx` | Centered CircularProgress with optional overlay |
| `EmptyState` | `EmptyState.jsx` | Icon + message + optional action button for empty tables |
| `ErrorAlert` | `ErrorAlert.jsx` | MUI Alert with dismiss action, optional retry button |
| `ConfirmDeleteDialog` | `ConfirmDeleteDialog.jsx` | MUI Dialog for delete confirmations (matches spec §5 component name) |
| `StatusChip` | `StatusChip.jsx` | Colored MUI Chip: green/ACTIVE, grey/INACTIVE, orange/MAINTENANCE |
| `SearchBar` | `SearchBar.jsx` | Debounced TextField with search icon |
| `FileDropzone` | `FileDropzone.jsx` | Drag-and-drop .xlsx file selector (spec §5 — BulkUploadPage child) |
| `UploadPreviewTable` | `UploadPreviewTable.jsx` | Validation results table with red error highlights (spec §5 — BulkUploadPage child) |
| `UploadSummaryPanel` | `UploadSummaryPanel.jsx` | Valid/failed row counts with commit action (spec §5 — BulkUploadPage child) |

---

### 6.1.1 Display-Specific Components — `frontend/src/components/displays/`

Per spec §5 component hierarchy, these components are children of DisplaysPage and DisplayDetailPage:

| Component | File | Used In | Purpose |
|-----------|------|---------|---------|
| `DisplayTable` | `DisplayTable.jsx` | DisplaysPage | MUI Table with columns: ID, Name, Location, Status, Actions |
| `DisplayFormDialog` | `DisplayFormDialog.jsx` | DisplaysPage | MUI Dialog modal for Add/Edit with React Hook Form |
| `DisplayCard` | `DisplayCard.jsx` | DisplayDetailPage | Read-only card view of a single display's details |
| `DisplayForm` | `DisplayForm.jsx` | DisplayDetailPage | Inline edit form reusing same validation as DisplayFormDialog |
| `BulkUploadPreview` | `BulkUploadPreview.jsx` | BulkUploadPage | Combined preview table + summary panel |

### 6.1.2 Utility: `frontend/src/utils/validators.js`

Per spec §2 directory structure, a client-side validation utility:

```js
// Reusable validators matching backend rules (spec §6.1)
export const VALID_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'];

export function validateDisplayId(value) {
  if (!value) return 'Required';
  if (value.length < 3 || value.length > 30) return 'Must be 3-30 characters';
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Alphanumeric only (hyphens/underscores allowed)';
  return null;
}

export function validateDisplayName(value) {
  if (!value) return 'Required';
  if (value.length < 2 || value.length > 100) return 'Must be 2-100 characters';
  return null;
}

export function validateIpAddress(value) {
  if (!value) return 'Required';
  const ipv4 = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  if (ipv4.test(value)) return null;
  return 'Invalid IP address format';
}

export function validateLocation(value) {
  if (!value) return 'Required';
  if (value.length < 2 || value.length > 150) return 'Must be 2-150 characters';
  return null;
}
```

---

## 6.2 LoginPage — `frontend/src/pages/LoginPage.jsx`

> **Spec §5.2.1** — Centered card with username/password fields, error display, loading state.

```jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress,
} from '@mui/material';
import { loginAdmin, clearAuthError } from '../redux/slices/authSlice';
import { useEffect } from 'react';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || '/displays';

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  useEffect(() => { dispatch(clearAuthError()); }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginAdmin({ username, password }));
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ width: 400, p: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom align="center">Sign In</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Username" margin="normal"
              value={username} onChange={(e) => setUsername(e.target.value)}
              autoFocus required />
            <TextField fullWidth label="Password" type="password" margin="normal"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required />
            <Button fullWidth variant="contained" type="submit" size="large"
              disabled={loading} sx={{ mt: 2 }}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
```

### States to Cover
- **Loading:** Button shows spinner, fields disabled
- **Error:** MUI Alert above form with error message from Redux (dismissible)
- **Already authenticated:** Redirect to `/displays` immediately

---

## 6.3 DisplayTable Component — `frontend/src/components/displays/DisplayTable.jsx`

> Spec §5 — Child component of DisplaysPage. Renders the paginated data grid.

```jsx
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
         IconButton, Chip, Skeleton } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const STATUS_COLORS = { ACTIVE: 'success', INACTIVE: 'default', MAINTENANCE: 'warning' };

export default function DisplayTable({ items, loading, onEdit, onDelete }) {
  if (loading && !items.length) {
    return <TableContainer><Table><TableBody>
      {[1,2,3,4,5].map(i => (
        <TableRow key={i}>
          {[1,2,3,4,5].map(j => <TableCell key={j}><Skeleton /></TableCell>)}
        </TableRow>
      ))}
    </TableBody></Table></TableContainer>;
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Display ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>IP Address</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id} hover>
              <TableCell>{item.display_id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.ip_address}</TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell>
                <Chip label={item.status} color={STATUS_COLORS[item.status] || 'default'} size="small" />
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(item)}><Edit /></IconButton>
                <IconButton onClick={() => onDelete(item)} color="error"><Delete /></IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

## 6.4 DisplayFormDialog Component — `frontend/src/components/displays/DisplayFormDialog.jsx`

> Spec §5 — MUI Dialog modal for Add (on DisplaysPage) and Edit (reused). Uses React Hook Form.

```
┌─────────────────────────────────────┐
│  Add Display / Edit Display   [X]   │
├─────────────────────────────────────┤
│  Display ID: [____________]         │
│  Name:      [____________]          │
│  IP Address:[____________]          │
│  Location:  [____________]          │
│  Status:    [ACTIVE ▼]              │
│  Profiles:  [____________]          │
│                     (comma-sep)     │
├─────────────────────────────────────┤
│         [Cancel]  [Save]            │
└─────────────────────────────────────┘
```

**States to cover:**

| State | Behavior |
|-------|----------|
| **Open (create)** | Empty form, title "Add Display" |
| **Open (edit)** | Pre-filled form, title "Edit Display" |
| **Validation error** | react-hook-form shows inline errors under each field |
| **Saving** | Submit button shows spinner, fields disabled |
| **Server error** | MUI Alert at top of dialog with error message |
| **Success** | Dialog closes, parent refreshes list |
| **Duplicate ID (400)** | Inline error on display_id field: "Display ID already exists" |

## 6.5 DisplaysPage — `frontend/src/pages/DisplaysPage.jsx`

> **Spec §5.2.2** — Paginated data table with search, status filter, create/delete actions.

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  Navbar                                                 │
├─────────────────────────────────────────────────────────┤
│  SearchBar  [status filter dropdown]  [+ Add Display]   │
├─────────────────────────────────────────────────────────┤
│  Data Table (MUI Table or DataGrid)                     │
│  ┌───────┬────────┬──────────┬────────┬────────┬─────┐  │
│  │  ID   │  Name  │ Location │ Status │ Action │     │  │
│  ├───────┼────────┼──────────┼────────┼────────┼─────┤  │
│  │DSP-001│Entrance│ Floor 1  │ ACTIVE │ ✏️ 🗑 │     │  │
│  └───────┴────────┴──────────┴────────┴────────┴─────┘  │
├─────────────────────────────────────────────────────────┤
│  Pagination controls                                     │
└─────────────────────────────────────────────────────────┘
```

### Implementation Notes

```
┌──────────────────────────────────────────────────────────┐
│  [SearchBar]  [StatusFilter ▼]  [+ Add Display]          │
├──────────────────────────────────────────────────────────┤
│  <DisplayTable>  ← extracted component                   │
│  ┌───────┬────────┬──────────┬────────┬────────┬──────┐  │
│  │  ID   │  Name  │ Location │ Status │ Action │      │  │
│  ├───────┼────────┼──────────┼────────┼────────┼──────┤  │
│  │DSP-001│Entrance│ Floor 1  │ ACTIVE │  ✏️ 🗑  │      │  │
│  └───────┴────────┴──────────┴────────┴────────┴──────┘  │
├──────────────────────────────────────────────────────────┤
│  Pagination controls                                      │
└──────────────────────────────────────────────────────────┘

<DisplayFormDialog>  ← shown when user clicks [+ Add] or [✏️ Edit]
<ConfirmDeleteDialog> ← shown when user clicks [🗑 Delete]
```

```jsx
const dispatch = useDispatch();
const { items, total, currentPage, limit, searchQuery, statusFilter, loading, error } =
  useSelector((state) => state.displays);
const [dialogOpen, setDialogOpen] = useState(false);
const [editingDisplay, setEditingDisplay] = useState(null);
const [deleteTarget, setDeleteTarget] = useState(null);

// Fetch on mount and on filter/page change
useEffect(() => {
  dispatch(fetchDisplays({
    page: currentPage,
    limit,
    search: searchQuery || undefined,
    status: statusFilter || undefined,
  }));
}, [dispatch, currentPage, limit, searchQuery, statusFilter]);

// Open dialog for create or edit
const handleAdd = () => { setEditingDisplay(null); setDialogOpen(true); };
const handleEdit = (display) => { setEditingDisplay(display); setDialogOpen(true); };

const handleDialogSave = (formData) => {
  const action = editingDisplay
    ? updateDisplay({ id: editingDisplay.id, ...formData })
    : createDisplay(formData);
  dispatch(action).unwrap().then(() => {
    setDialogOpen(false);
    dispatch(fetchDisplays({ page: currentPage, limit }));
  });
};

// Delete with ConfirmDeleteDialog
const confirmDelete = () => {
  dispatch(deleteDisplay(deleteTarget.id));
  setDeleteTarget(null);
};
```

### States to Cover

| State | UI Behavior |
|-------|-------------|
| **Loading (initial)** | DisplayTable shows 5 skeleton rows |
| **Loading (refetch)** | Table overlay spinner, existing rows remain visible |
| **Empty (no search)** | EmptyState: monitor icon + "No displays yet. Add your first display." + CTA button |
| **Empty (search)** | EmptyState: search icon + "No displays match your search." + clear filters button |
| **Error (fetch)** | ErrorAlert with retry button + "Failed to load displays" |
| **Error (create/update)** | Inline error inside DisplayFormDialog |
| **Error (delete)** | Snackbar toast: "Failed to delete display" |
| **Delete pending** | ConfirmDeleteDialog shows spinner on confirm button |

---

## 6.6 DisplayDetailPage — `frontend/src/pages/DisplayDetailPage.jsx`

> **Spec §5.2.3** — View single display details with inline edit toggle.

### Layout
```
┌─────────────────────────────────────────────────┐
│  Navbar                                         │
├─────────────────────────────────────────────────┤
│  ← Back to Displays     [Edit] [Delete]         │
├─────────────────────────────────────────────────┤
│  <DisplayCard>  ← extracted read-only component │
│  ┌─────────────────────────────────────────────┐│
│  │  Display ID: DSP-001    Status: [ACTIVE]   ││
│  │  Name: Main Entrance                       ││
│  │  IP: 192.168.1.50     Location: Floor 1    ││
│  │  Content Profiles: Wayfinding, Event       ││
│  │  Created: 2024-01-15   Updated: 2024-03-01 ││
│  └─────────────────────────────────────────────┘│
│                                                  │
│  <DisplayForm>  ← shown when [Edit] is clicked  │
│  (inline edit mode with Save/Cancel)             │
└─────────────────────────────────────────────────┘
```

### DisplayForm Component — `frontend/src/components/displays/DisplayForm.jsx`

> Inline edit form for DisplayDetailPage. Reuses same validation logic as DisplayFormDialog.

```jsx
import { useForm } from 'react-hook-form';
import { Box, TextField, MenuItem, Button, Stack } from '@mui/material';
import { VALID_STATUSES, validateDisplayId, validateDisplayName, validateIpAddress, validateLocation } from '../../utils/validators';

export default function DisplayForm({ display, onSave, onCancel }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      display_id: display?.display_id || '',
      name: display?.name || '',
      ip_address: display?.ip_address || '',
      location: display?.location || '',
      status: display?.status || 'ACTIVE',
      content_profiles: display?.content_profiles?.map(p => p.name).join(', ') || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await onSave(data);
    } catch (err) {
      if (err.errors) {
        err.errors.forEach(e => setError(e.field, { type: 'server', message: e.message }));
      }
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={2}>
        <TextField label="Display ID" {...register('display_id', { validate: validateDisplayId })}
          error={!!errors.display_id} helperText={errors.display_id?.message} />
        <TextField label="Name" {...register('name', { validate: validateDisplayName })}
          error={!!errors.name} helperText={errors.name?.message} />
        <TextField label="IP Address" {...register('ip_address', { validate: validateIpAddress })}
          error={!!errors.ip_address} helperText={errors.ip_address?.message} />
        <TextField label="Location" {...register('location', { validate: validateLocation })}
          error={!!errors.location} helperText={errors.location?.message} />
        <TextField label="Status" select {...register('status')} defaultValue="ACTIVE">
          {VALID_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField label="Content Profiles" {...register('content_profiles')}
          helperText="Comma-separated profile names" />
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
```

### States to Cover

| State | UI Behavior |
|-------|-------------|
| **Loading** | Card with Skeleton lines |
| **Not found (404)** | Error state with "Display not found" + back button |
| **View mode** | Read-only card with field labels and values |
| **Edit mode** | DisplayForm inline with Save/Cancel |
| **Save success** | Snackbar "Display updated", revert to view mode, update Redux |
| **Save error** | Alert in form with server error message |
| **Delete** | ConfirmDialog, then navigate back to list |
| **Network error** | ErrorAlert with retry |

---

## 6.7 BulkUploadPage — `frontend/src/pages/BulkUploadPage.jsx`

> **Spec §5.2.4, §6.3** — 3-step wizard: Download → Upload → Review → Commit.

### Step Flow

```
Step 0: Download Template
  [Download Excel Template] button
  ───────────────────────────────────────
Step 1: Upload File
  [Dropzone / FileSelect] → validate button
  ───────────────────────────────────────
Step 2: Validation Preview
  Summary: ✅ 45 valid | ❌ 3 failed
  ┌───────┬────────┬────────┬─────────┐
  │  Row  │  Field │  Value │  Error  │
  ├───────┼────────┼────────┼─────────┤
  │  #5   │  IP    │ bad.ip │ Invalid │
  └───────┴────────┴────────┴─────────┘
  [Download Failed Rows]  [↩ Edit File]  [Proceed to Commit]
  ───────────────────────────────────────
Step 3: Commit Result
  ✅ Successfully imported 45 displays
  ❌ 3 records failed
  [Download Error Report]
```

### Child Components (per spec §5)

| Component | File | Purpose |
|-----------|------|---------|
| `FileDropzone` | `FileDropzone.jsx` | Drag & drop zone with `accept=".xlsx"`, file size warning, clear button |
| `UploadPreviewTable` | `UploadPreviewTable.jsx` | Table rendering `preview` rows: green bg for valid, red bg for invalid rows with error tooltips |
| `UploadSummaryPanel` | `UploadSummaryPanel.jsx` | Shows valid/failed/total counts, "Download Failed Rows" button, "Commit" button |

### Implementation Notes

```jsx
const dispatch = useDispatch();
const {
  previewData, validationSummary, isValidating,
  isCommitting, uploadError, commitResult,
} = useSelector((state) => state.upload);
const [step, setStep] = useState(0);
const [selectedFile, setSelectedFile] = useState(null);

const handleUpload = () => {
  if (!selectedFile) return;
  dispatch(validateExcelFile(selectedFile));
};

const handleCommit = () => {
  const validRows = previewData.filter(r => r.is_valid).map(r => r.data);
  dispatch(commitBulkUpload(validRows));
};

// Show validation error rows grouped by error type
const failedRows = previewData.filter(r => !r.is_valid);
```

### States to Cover

| State | UI Behavior |
|-------|-------------|
| **Step 0: No template** | Info card + download button |
| **Step 1: No file** | File dropzone with accept=".xlsx" |
| **Step 1: Wrong file type** | Client-side validation: show error instantly |
| **Step 2: Validating** | LinearProgress bar + "Validating..." text |
| **Step 2: Validation failed** | Red summary badge, expandable error table |
| **Step 2: All valid** | Green summary badge, show commit button prominently |
| **Step 3: Committing** | CircularProgress overlay, "Importing displays..." |
| **Step 3: Commit success** | SuccessAlert with stats, "Upload another" button |
| **Step 3: Commit partial** | WarningAlert: X inserted, Y failed, download errors link |
| **Step 3: Commit error** | ErrorAlert with server message |
| **Upload error** | ErrorAlert "File exceeds 10MB" or "Invalid Excel format" |

---

## 6.8 Content Profiles Endpoint (Backend Gap)

> **Spec §2 directory structure** includes `backend/app/api/v1/endpoints/content_profiles.py` — not yet planned in any backend phase.

**Add this endpoint to provide CRUD for Content Profiles:**

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET` | `/api/content-profiles` | JWT | List all profiles |
| `POST` | `/api/content-profiles` | JWT | Create a profile |
| `GET` | `/api/content-profiles/{id}` | JWT | Get single profile |
| `PUT` | `/api/content-profiles/{id}` | JWT | Update profile |
| `DELETE` | `/api/content-profiles/{id}` | JWT | Delete profile |

**Schema** (`backend/app/schemas/content_profile.py`):
```python
from pydantic import BaseModel, Field
from typing import Optional

class ContentProfileCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=250)
    priority: str = Field("MEDIUM", pattern=r"^(CRITICAL|HIGH|MEDIUM|LOW)$")

class ContentProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    description: Optional[str] = Field(None, max_length=250)
    priority: Optional[str] = Field(None, pattern=r"^(CRITICAL|HIGH|MEDIUM|LOW)$")

class ContentProfileResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    priority: str
    created_at: datetime
```

**Effort:** ~1 hour (simple CRUD on existing model).

---

## 6.9 Page Routing Summary

| Route | Page Component | Auth Required | Spec § |
|-------|---------------|---------------|--------|
| `/login` | LoginPage | No | §5.2.1 |
| `/displays` | DisplaysPage | Yes | §5.2.2 |
| `/displays/:id` | DisplayDetailPage | Yes | §5.2.3 |
| `/displays/upload` | BulkUploadPage | Yes | §5.2.4 |
| `/` | Redirect → `/displays` | — | — |
| `*` | Redirect → `/displays` | — | — |

---

## 6.10 Snackbar / Toast Notification System

> Spec §5.3.1 — Global notifications for success/error actions.

**Approach:** Create a `NotificationProvider` context + component at App root.

```jsx
// frontend/src/components/common/NotificationProvider.jsx
import { Snackbar, Alert } from '@mui/material';
import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');

  const notify = useCallback((msg, sev = 'success') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Snackbar open={open} autoHideDuration={4000} onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={severity} onClose={() => setOpen(false)}>{message}</Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
}
```

---

## 6.11 Responsive Breakpoints (from spec §10)

| Breakpoint | Layout Behavior |
|------------|----------------|
| **xs (0–600px)** | Single column, table → stacked cards, full-width modals |
| **sm (600–900px)** | Table with horizontal scroll, 2-column forms |
| **md+ (900px+)** | Full table, multi-column layouts, side panels |

---

## Verification Checklist

### LoginPage
- [ ] Renders centered card with username/password fields
- [ ] Shows loading spinner on submit
- [ ] Shows server error in Alert on failed login
- [ ] Redirects to `/displays` on success
- [ ] Redirects to original URL after login (return-to)
- [ ] Already authenticated → immediate redirect

### DisplayTable
- [ ] Renders skeleton rows while loading (no existing items)
- [ ] Shows StatusChip with correct color for each status value
- [ ] Edit button opens DisplayFormDialog in edit mode
- [ ] Delete button opens ConfirmDeleteDialog

### DisplayFormDialog
- [ ] Opens in "create" mode with empty form when [+ Add] clicked
- [ ] Opens in "edit" mode with pre-filled values when [✏️] clicked
- [ ] React Hook Form validates all fields client-side (display_id, name, IP, location)
- [ ] Status dropdown shows ACTIVE, INACTIVE, MAINTENANCE
- [ ] Shows spinner on Save button while submitting
- [ ] Shows server error (400 duplicate ID) inline on the display_id field
- [ ] Closes and refreshes list on successful save

### DisplaysPage
- [ ] Shows DisplayTable with skeleton while loading
- [ ] SearchBar debounces (300ms) and re-fetches via Redux
- [ ] Status filter dropdown re-fetches via Redux
- [ ] Pagination controls update Redux state
- [ ] Empty state when no displays exist and no search active
- [ ] "No matches" empty state when search has no results
- [ ] Error state with retry button
- [ ] [+ Add Display] opens DisplayFormDialog in create mode
- [ ] [🗑] opens ConfirmDeleteDialog

### DisplayDetailPage
- [ ] Loading state with skeleton
- [ ] View mode shows DisplayCard with all fields
- [ ] [Edit] toggles to DisplayForm inline
- [ ] Save dispatches updateDisplay thunk
- [ ] Save error shows inline Alert on form
- [ ] Delete shows ConfirmDeleteDialog then navigates to /displays
- [ ] 404 state with "Display not found" + back button

### BulkUploadPage
- [ ] Step 0: Download template via Redux thunk → browser download
- [ ] Step 1: FileDropzone accepts only .xlsx
- [ ] Step 1: Shows error on wrong file type
- [ ] Step 2: UploadPreviewTable shows green rows for valid, red rows for invalid
- [ ] Step 2: UploadSummaryPanel shows valid/failed/total counts
- [ ] Step 2: "Download Failed Rows" button is present when failures exist
- [ ] Step 2: "Commit" button only enabled when valid rows > 0
- [ ] Step 3: Commit progress indicator shown
- [ ] Step 3: Success/failure stats displayed
- [ ] Step 3: Error report download available

### Snackbar Notifications
- [ ] Create/Update/Delete success → green snackbar
- [ ] Create/Update/Delete error → red snackbar
- [ ] Auto-dismisses after 4 seconds

### Content Profiles Endpoint
- [ ] GET/POST/PUT/DELETE `/api/content-profiles` all work with JWT auth
- [ ] Response shapes match spec DisplayResponse content_profiles nesting

### Responsive
- [ ] Login page is centered on all viewports
- [ ] Table scrolls horizontally on mobile (or renders as cards on xs)
- [ ] Dialogs are full-width on small screens
- [ ] Bulk upload layout stacks vertically on mobile

### Global
- [ ] Snackbar notifications appear on CRUD success/error
- [ ] All pages responsive on mobile viewport
- [ ] Navbar shows on all pages when authenticated
- [ ] Logout works from any page
- [ ] 401 interceptor redirects to login from any page

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `reviewer` | Verify every page covers all states from UI plan: loading, empty, error, success. Check MUI component usage matches design system. Validate form validation rules match backend schemas. Confirm DisplayFormDialog + DisplayTable match spec §5 component hierarchy |
| `refactoring-expert` | Review extracted components (DisplayTable, DisplayFormDialog, FileDropzone) for clean separation of concerns. Ensure no duplicate validation logic between client validators.js and backend |
| `test-runner` | (Deferred to Phase 8 — write UI tests for each page's states using interaction flows from UI plan) |
| `ui-planner` | Validate a11y compliance: color contrast, keyboard nav, focus management, reduced-motion. Verify responsive behavior at xs/sm/md+ breakpoints |
