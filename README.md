# Signage-OS : Digital Signage Display Management System

A full-stack web application for managing digital signage displays with bulk upload via Excel. Built with FastAPI + MongoDB + React.


<img width="1915" height="870" alt="image" src="https://github.com/user-attachments/assets/22ce0d98-cfb1-48eb-9347-4ac674d5be07" />

<img width="1917" height="876" alt="Screenshot 2026-07-23 025003" src="https://github.com/user-attachments/assets/8f3f196a-296c-4284-95ca-e0567991c822" />



## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | **Python 3.11, FastAPI** | Async REST API |
| Database | **MongoDB 7** | Document store |
| ODM | **Beanie** (Motor + Pydantic) | Async MongoDB interface |
| Auth | **JWT (HS256) + bcrypt** | Stateless authentication |
| Excel | **openpyxl** | Template generation & parsing |
| Frontend | **React 18, Vite** | SPA framework |
| UI | **MUI v5** | Material Design components |
| State | **Redux Toolkit** | 3 slices (auth, display, upload) |
| Routing | **React Router v6** | Client-side navigation |
| HTTP | **Axios** | API client with JWT interceptor |
| Container | **Docker Compose** | Multi-service deployment |

## Prerequisites

- Docker & Docker Compose (for containerized setup)
- Python 3.11+ & Node.js 20+ (for manual setup)

## Quick Start (Docker)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |

### Seed Admin User

```bash
docker exec -it signage-backend python -m app.core.seed
```

**Default credentials:** `admin@example.com` / `SecurePassword123`

## Manual Setup

### Backend

```bash
cd backend
cp .env.example .env          # Edit with your MongoDB URL + JWT secret
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env          # Set VITE_API_BASE_URL if needed
npm install
npm run dev
```

## Features

### Authentication
- JWT-based login with 8-hour token expiry
- bcrypt password hashing via passlib
- Auto-redirect to login on token expiry
- Register new admin accounts
- Remember me / logout

### Display Management
- Create, read, update, and delete displays
- Paginated list with configurable page size (max 100)
- Multi-field text search (name, IP address, location)
- Status filter (ACTIVE / INACTIVE / MAINTENANCE)
- Rich dashboard with KPI cards, donut chart, and 3D globe

### Bulk Upload (Excel)
- **Step 1:** Download pre-formatted Excel template
- **Step 2:** Upload .xlsx file via drag-and-drop
- **Step 3:** Backend validates each row:
  - File structure & column presence
  - Field format (display_id, IP, location, status)
  - Duplicate detection (within sheet + database)
  - Content profile cross-reference
- **Step 4:** Preview table with green (valid) / red (invalid) row highlighting
  - Per-row error chips with field and message
- **Step 5:** Commit valid rows to database via batch insert
  - Auto-creates missing content profiles
- **Failed rows export:** Download invalid rows as an Excel file with error descriptions

### Content Profiles
- Manage shared profile definitions (name, description, priority)
- Priority levels: CRITICAL, HIGH, MEDIUM, LOW
- Linked to displays via Beanie `Link` references
- Auto-created during bulk upload if missing

### UI/UX
- Light and dark mode with persistent preference
- Responsive design (desktop, tablet, mobile)
- 3D CSS globe with animated city markers
- AI insights panel in sidebar
- Animated transitions and hover effects
- Glassmorphism card design

## API Endpoints

All endpoints except `/api/auth/login` and `/api/auth/register` require `Authorization: Bearer <JWT>`.

### Authentication

| Method | Endpoint | Auth | Request | Response |
|--------|----------|------|---------|----------|
| POST | `/api/auth/login` | No | `{ username, password }` | `{ access_token, token_type, expires_at }` |
| POST | `/api/auth/register` | No | `{ username, password }` | `{ access_token, token_type, expires_at }` |

### Displays

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/displays` | Paginated list (query: `page`, `limit`, `search`, `status`) |
| POST | `/api/displays` | Create display |
| GET | `/api/displays/{id}` | Get single display |
| PUT | `/api/displays/{id}` | Update display |
| DELETE | `/api/displays/{id}` | Delete display (204) |

### Bulk Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/displays/bulk-upload/template` | Download .xlsx template |
| POST | `/api/displays/bulk-upload/validate` | Validate uploaded Excel → preview + errors |
| POST | `/api/displays/bulk-upload/commit` | Commit validated rows to DB |
| POST | `/api/displays/bulk-upload/failed-rows` | Download failed rows as .xlsx |

### Content Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content-profiles` | List all profiles |
| POST | `/api/content-profiles` | Create profile |
| PUT | `/api/content-profiles/{id}` | Update profile |
| DELETE | `/api/content-profiles/{id}` | Delete profile (204) |

## Architecture

```
signage-management-app/
├── backend/                       # FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # App factory, middleware, lifespan events
│   │   ├── api/
│   │   │   ├── deps.py           # JWT dependency (get_current_admin)
│   │   │   └── v1/
│   │   │       ├── api.py        # Router aggregation
│   │   │       └── endpoints/
│   │   │           ├── auth.py        # POST /login, /register
│   │   │           ├── displays.py    # CRUD + bulk upload endpoints
│   │   │           └── content_profiles.py
│   │   ├── core/
│   │   │   ├── config.py         # Settings via pydantic-settings
│   │   │   ├── security.py       # JWT create/decode, bcrypt hash/verify
│   │   │   ├── database.py       # Beanie init, health check
│   │   │   ├── exceptions.py     # Custom exceptions
│   │   │   ├── error_handlers.py # Global exception handlers
│   │   │   ├── logger.py         # Logging config
│   │   │   └── seed.py           # Admin seeder
│   │   ├── models/
│   │   │   ├── admin.py          # Beanie Document
│   │   │   ├── display.py        # Beanie Document + indexes
│   │   │   └── content_profile.py
│   │   ├── schemas/
│   │   │   ├── auth.py           # TokenResponse, LoginRequest
│   │   │   ├── display.py        # DisplayCreate, Update, Response
│   │   │   ├── content_profile.py
│   │   │   ├── excel.py          # ValidationResponse, CommitResponse
│   │   │   └── error.py          # Standardized error schema
│   │   └── services/
│   │       ├── display_service.py    # CRUD + pagination logic
│   │       ├── display_formatter.py  # Response formatting
│   │       ├── excel_parser.py       # Excel validation + commit
│   │       └── excel_template.py     # Template + failed rows generation
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── unit/
│   │   │   ├── test_excel_parser.py
│   │   │   └── test_security.py
│   │   └── integration/
│   │       ├── test_auth_api.py
│   │       ├── test_bulk_upload_api.py
│   │       └── test_displays_api.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/                      # Vite + React SPA
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── main.jsx              # Entry point
│   │   ├── App.jsx               # Router config
│   │   ├── index.css / App.css   # Global styles
│   │   ├── theme.js              # MUI light/dark theme
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/           # ProtectedRoute, EmptyState, ErrorBoundary, etc.
│   │   │   ├── dashboard/       # SignageKPI, GlobeMap, TopLocations, etc.
│   │   │   ├── displays/        # DisplayTable, FileDropzone, UploadPreview, etc.
│   │   │   └── layout/          # Sidebar, AppHeader, DashboardLayout, AIPanel
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DisplaysPage.jsx
│   │   │   ├── BulkUploadPage.jsx
│   │   │   └── DisplayDetailPage.jsx
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js       # login, register, logout thunks
│   │   │       ├── displaySlice.js    # CRUD + fetch thunks
│   │   │       └── uploadSlice.js     # validate, commit, download thunks
│   │   ├── services/
│   │   │   ├── api.js            # Axios instance + JWT interceptor
│   │   │   ├── authService.js
│   │   │   └── displayService.js
│   │   └── utils/
│   │       └── validators.js
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   ├── 00-INDEX.md               # Master task planner
│   ├── 01-phase-setup.md through 11-phase-deploy.md
│   ├── technical_new.md          # Full technical documentation
│   └── diagrams_plantuml.md      # PlantUML diagram source code
├── docker-compose.yml            # Development stack
├── docker-compose.prod.yml       # Production stack
└── README.md
```

## Data Flow

```
Administrator → Login Page → POST /api/auth/login → JWT returned
     ↓
Stored in localStorage → Attached as Bearer header on all requests
     ↓
Displays Page → GET /api/displays → FastAPI validates JWT → MongoDB query → paginated response
     ↓
Bulk Upload → Upload .xlsx → POST /api/displays/bulk-upload/validate
     ↓
Return preview with per-row errors → User reviews → POST /api/displays/bulk-upload/commit
     ↓
Batch insert via Display.insert_many() → Success summary → Optional: Download failed rows
```

## Testing

```bash
# Backend (requires MongoDB running)
cd backend && pytest tests/ -v --cov=app

# Frontend
cd frontend && npx vitest run
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | `signage_db` | Database name |
| `JWT_SECRET_KEY` | (required) | Secret for HS256 signing |
| `JWT_ALGORITHM` | `HS256` | Signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Token expiry (8 hours) |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |

## Deployment

### Production (Docker Compose)

```bash
# 1. Set JWT secret
echo "JWT_SECRET_KEY=$(openssl rand -hex 32)" > backend/.env

# 2. Start stack
docker compose -f docker-compose.prod.yml up --build -d
```

The production stack includes:
- **MongoDB** — bound to `127.0.0.1` (not publicly exposed)
- **Backend** — health checks, env file, CORS restricted, debug off
- **Frontend** — Nginx serving built assets on port 80

### Cloud Deployment

| Platform | Component | Notes |
|----------|-----------|-------|
| **Vercel** | Frontend only | Static SPA, set `VITE_API_BASE_URL` |
| **Render** | Backend | Web service, start: `uvicorn app.main:app` |
| **MongoDB Atlas** | Database | Free 512MB cluster |
| **Railway** | Full stack | Supports both + MongoDB |

## Documentation

- [Technical Documentation](./docs/technical_new.md) — Link : https://drive.google.com/file/d/1wvl3AqTsNBi5IIKha75CPtwZTgrMitYh/view?usp=sharing Full architecture, API spec, DB design
- [PlantUML Diagrams](./docs/diagrams_plantuml.md) — Source code for all architecture diagrams
- [Phase Docs](./docs/) — Step-by-step implementation guides (Phase 0–11)

## Security

- Passwords hashed with **bcrypt** via passlib
- JWT signed with **HS256**, 8-hour expiry
- Rate limiting on auth endpoints (5 req/min via SlowAPI)
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- Excel upload limited to **10MB** to prevent DoS
- Input sanitization via **Pydantic** validators
- CORS restricted to frontend origin
- MongoDB bound to localhost in production
