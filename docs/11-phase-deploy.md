# Phase 10: Polish, Docker & Deployment

> **Effort:** 6–8 hours (max) | **Depends on:** All Phases | **Agent:** reviewer

---

## Objective

Finalize the application for production: UI polish, Docker optimization, production configuration, CI/CD pipeline, README docs, and a full acceptance criteria check against spec §10.

> **Spec reference:** §10 (Acceptance Criteria — Definition of Done)

---

## 10.1 Final UI Polish

### 10.1.1 Responsive Design Check (spec §10 Quality)

Verify all pages at breakpoints:

| Breakpoint | Pages to Verify | Pass Criteria |
|------------|----------------|---------------|
| **375px** (mobile) | LoginPage, DisplaysPage, DisplayDetailPage, BulkUploadPage | No horizontal scroll, text not clipped, dialogs full-width |
| **768px** (tablet) | All pages | 2-column forms, table horizontal scroll works |
| **1280px+** (desktop) | All pages | Full table, max-width container, side-by-side layouts |

**Mobile-specific fixes:**
```jsx
// DisplaysPage — replace table with cards on xs:
import { useTheme, useMediaQuery } from '@mui/material';
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

{isMobile ? (
  // Stack of MUI Cards with each display's info
  items.map(item => <DisplayCard key={item.id} display={item} />)
) : (
  <DisplayTable items={items} ... />
)}

// BulkUploadPage — stack UploadPreviewTable vertically
<Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
  <UploadPreviewTable />
  <UploadSummaryPanel />
</Stack>
```

### 10.1.2 Empty States (spec §10 Quality)

Check every page/component has an empty state:

| Page/Component | Empty State Message | Icon |
|----------------|---------------------|------|
| DisplaysPage | "No displays yet. Add your first display." | `MonitorIcon` |
| DisplaysPage (search) | "No displays match your search. Try different keywords." | `SearchOffIcon` |
| DisplayTable | (same as DisplaysPage) | — |
| BulkUploadPage (no uploads) | "Ready to import displays. Download a template to get started." | `UploadFileIcon` |
| UploadPreviewTable | "Upload a file to see validation results." | `PreviewIcon` |

### 10.1.3 Loading Indicators (spec §10 Quality)

| Component | Loading State |
|-----------|--------------|
| DisplayTable | 5 MUI Skeleton rows |
| DisplayDetailPage | Card with Skeleton lines |
| DisplayFormDialog | Submit button: CircularProgress replaces text |
| BulkUploadPage (validation) | LinearProgress bar with "Validating..." label |
| BulkUploadPage (commit) | CircularProgress overlay, "Importing displays..." |
| LoginPage | Submit button: CircularProgress |
| Page transitions | Suspense fallback: centered CircularProgress |

### 10.1.4 Graceful Failure Handling (spec §10 Quality)

- All API errors show user-friendly messages (never raw stack traces)
- Retry buttons on network failures
- ErrorBoundary catches React crashes
- OfflineBanner when browser is offline
- 401 → redirect to /login with info toast

---

> **Note:** Phase 0 (§0.4) provides a **development** `docker-compose.yml` (Vite dev server on port 5173, backend with hot reload). This section provides a **production** `docker-compose.yml` (Nginx on port 80, multi-stage builds, healthchecks). Use the dev compose for development, the prod compose for deployment.

## 10.2 Production Docker Configuration

### 10.2.1 Frontend Dockerfile — Multi-stage build

```dockerfile
# frontend/Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 10.2.2 Frontend Nginx Config — `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 256;

    # Static assets with cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback — serve index.html for all non-file routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 10.2.3 Production `docker-compose.yml`

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: signage-mongo
    restart: unless-stopped
    ports:
      - "127.0.0.1:27017:27017"  # localhost only
    volumes:
      - mongo_data:/data/db
      - mongo_config:/data/configdb
    environment:
      MONGO_INITDB_DATABASE: signage_db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: signage-backend
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      - DEBUG=false
      - MONGODB_URL=mongodb://mongodb:27017
      - MONGODB_DB_NAME=signage_db
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - JWT_ALGORITHM=HS256
      - ACCESS_TOKEN_EXPIRE_MINUTES=480
      - CORS_ORIGINS=["https://signage.example.com"]
      - MAX_UPLOAD_SIZE_MB=10
    env_file:
      - ./backend/.env
    depends_on:
      mongodb:
        condition: service_healthy
    healthcheck:
      test: curl -f http://localhost:8000/api/health || exit 1
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: signage-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mongo_data:
  mongo_config:
```

### 10.2.4 Backend Production Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Non-root user for security
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Run with uvicorn in production mode
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

---

## 10.3 CI/CD Configuration

### 10.3.1 GitHub Actions — `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install -r tests/requirements-test.txt
      - name: Run tests with coverage
        run: |
          cd backend
          pytest tests/ -v --cov=app --cov-report=term --cov-fail-under=80
        env:
          MONGODB_URL: mongodb://localhost:27017
          JWT_SECRET_KEY: test-secret-key-for-ci

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests
        run: cd frontend && npx vitest run --coverage
      - name: Build
        run: cd frontend && npm run build

  docker-build:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: docker compose build
```

### 10.3.2 `.dockerignore`

```gitignore
# backend/.dockerignore
__pycache__/
venv/
.env
.git
*.md
tests/

# frontend/.dockerignore
node_modules/
.git
*.md
__tests__/
```

---

## 10.4 Environment Configuration

### `backend/.env.example` — committed to repo

```env
# Digital Signage Display Management — Backend Configuration
# Copy this file to .env and fill in production values

# --- App ---
DEBUG=false

# --- MongoDB ---
MONGODB_URL=mongodb://mongodb:27017
MONGODB_DB_NAME=signage_db

# --- JWT ---
# Generate with: openssl rand -hex 32
JWT_SECRET_KEY=change-this-to-a-secure-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# --- CORS ---
# Comma-separated list of allowed origins
CORS_ORIGINS=["https://signage.example.com"]

# --- Upload ---
MAX_UPLOAD_SIZE_MB=10
```

### `frontend/.env.example`

```env
# Digital Signage Display Management — Frontend Configuration
# Copy this file to .env.local

# API base URL (leave empty to use Vite proxy in dev)
VITE_API_BASE_URL=/api
```

---

## 10.5 README Finalization

### `README.md` sections to complete:

1. **Project title + description** (1 paragraph)
2. **Tech stack badges** (Python 3.11, FastAPI, MongoDB, React 18, Vite, MUI v5)
3. **Prerequisites** (Docker, Python 3.11+, Node 20+)
4. **Quick Start** (the primary dev flow):
   ```bash
   # Clone and run with Docker
   git clone <repo-url>
   cd signage-management-app
   cp backend/.env.example backend/.env  # edit secrets
   docker compose up
   # Open http://localhost
   ```
5. **Manual Setup** (without Docker):
   - Backend: venv, pip install, uvicorn
   - Frontend: npm install, npm run dev
6. **Architecture overview** (diagram or text)
7. **API Documentation** link (Swagger: `/docs`)
8. **Testing**:
   ```bash
   # Backend
   cd backend && pytest tests/ -v --cov=app
   # Frontend
   cd frontend && npx vitest run
   ```
9. **Environment Variables** table
10. **Project structure** tree (from spec §2)

---

## 10.6 Acceptance Criteria Verification (spec §10)

### Auth
- [ ] Admin logs in at `/login` with `admin@example.com` / `SecurePassword123`
- [ ] JWT returned and stored in localStorage
- [ ] All subsequent API requests include `Authorization: Bearer <token>`
- [ ] Logout clears token from localStorage and redirects to login
- [ ] Token expired → auto-redirect to login with info message
- [ ] Invalid credentials → error message on login form (no redirect)

### CRUD
- [ ] Admin can create a display via DisplayFormDialog on DisplaysPage
- [ ] Admin can read: list (paginated) + detail page
- [ ] Admin can edit: inline form on DisplayDetailPage or modal
- [ ] Admin can delete with confirmation dialog
- [ ] Search updates results in real-time (debounced, re-fetches)
- [ ] Status filter narrows results
- [ ] Pagination works end-to-end (prev, next, page numbers)

### Bulk Upload
- [ ] Template downloads as `.xlsx` with correct columns and Instructions sheet
- [ ] Upload valid Excel → preview shows all rows as valid → commit succeeds
- [ ] Upload invalid Excel → flags exact lines, showing inline errors (spec §10: "exact lines, showing inline errors")
- [ ] Upload non-xlsx file → 422 error displayed on page
- [ ] Upload >10MB → error displayed
- [ ] Missing column → explicit error showing column names
- [ ] Duplicate display_id → flagged per-row
- [ ] Download failed rows → generates Excel with errors appended
- [ ] Commit only inserts valid rows (or all-or-nothing based on implementation)

### Quality
- [ ] Responsive: works on 375px mobile, 768px tablet, 1280px+ desktop
- [ ] Empty states: meaningful messages on all empty lists
- [ ] Loading indicators: skeleton, spinner, progress bar on all async operations
- [ ] Graceful failure: error messages (not stack traces), retry buttons, offline detection
- [ ] Code: no hardcoded credentials, clean imports, modular components

---

## 10.7 Pre-Launch Checklist

| Area | Check | Verified |
|------|-------|----------|
| **Security** | No hardcoded secrets in code | ☐ |
| **Security** | JWT secret is random 64-char hex | ☐ |
| **Security** | DEBUG=false in production | ☐ |
| **Security** | CORS origins restricted | ☐ |
| **Security** | Login rate-limited (5/min) | ☐ |
| **Docker** | Backend Dockerfile builds clean | ☐ |
| **Docker** | Frontend Dockerfile builds clean | ☐ |
| **Docker** | `docker compose up` starts all 3 services | ☐ |
| **Docker** | Backend health check passes | ☐ |
| **Docker** | Frontend serves at http://localhost | ☐ |
| **Docker** | API proxy works through Nginx | ☐ |
| **Testing** | Backend coverage ≥ 80% | ☐ |
| **Testing** | All frontend tests pass | ☐ |
| **CI/CD** | GitHub Actions workflow tests pass | ☐ |
| **Docs** | README is complete with quick start | ☐ |
| **Docs** | .env.example committed (no real secrets) | ☐ |
| **Spec** | All spec §10 acceptance criteria met | ☐ |

---

## 10.8 Deployment Commands

```bash
# Build and start all services
docker compose up --build -d

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Seed the database (inside container)
docker exec -it signage-backend python -m app.core.seed

# Run migrations/indexes (re-init Beanie on startup handles this)

# Health check
curl http://localhost/api/health
# → {"status": "ok", "version": "1.0.0", "database": "connected"}

# Stop all services
docker compose down

# Stop and remove volumes (reset DB)
docker compose down -v
```

---

## Verification Checklist

- [ ] `docker compose up --build` starts MongoDB, backend, frontend without errors
- [ ] Frontend accessible at http://localhost:80
- [ ] Backend health check at http://localhost/api/health returns OK
- [ ] API proxy works: frontend → /api/* → backend
- [ ] Login flow works end-to-end through Docker setup
- [ ] Seed script creates admin + content profiles
- [ ] All spec §10 acceptance criteria are met (checklist above)
- [ ] `.env.example` has no real secrets
- [ ] `README.md` is complete with quick start instructions
- [ ] GitHub Actions CI passes all checks
- [ ] Responsive design verified on 3 breakpoints
- [ ] Empty states render on all pages when data absent
- [ ] Loading indicators appear on all async operations
- [ ] Error states show user-friendly messages (not stack traces)

---

## Agent Dispatch

| Agent | Task |
|-------|------|
| `reviewer` | Final review: verify all spec §10 acceptance criteria pass. Check README, .env.example, docker-compose.yml are consistent. Confirm no hardcoded credentials exist anywhere |
| `security-auditor` | Final security sweep: scan for secrets, verify DEBUG=false, check CORS, confirm JWT secret is env-based |
| `test-runner` | Run full test suite: `pytest --cov=app --cov-fail-under=80` and `npx vitest run`. Report any regressions |
