# Technical Documentation

**Service:** Signage OS — Digital Signage Display Management
**Version:** 1.0.0
**Status:** Production
**Last updated:** 2026-07-23

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack](#4-technology-stack)
5. [Installation and Setup](#5-installation-and-setup)
6. [Database Design](#6-database-design)
7. [API Documentation](#7-api-documentation)
8. [Usage Guide](#8-usage-guide)
9. [Security and Scalability](#9-security-and-scalability)
10. [Testing](#10-testing)
11. [Deployment](#11-deployment)
12. [Support and Maintenance](#12-support-and-maintenance)
13. [Future Enhancements](#13-future-enhancements)
14. [Change Log](#14-change-log)
15. [References](#15-references)

---

# 1. Introduction

## 1.1 Purpose
This document is the technical reference for **Signage OS**, a full-stack digital signage display management application. It describes the system architecture, database design, API specifications, frontend component hierarchy, bulk upload workflow, security model, and deployment strategy for the platform.

## 1.2 Scope
The document covers the entire Signage OS repository: the FastAPI backend with MongoDB/Beanie ODM, the React frontend with MUI v5 and Redux Toolkit, JWT-based authentication, display CRUD operations, bulk Excel upload with validation pipeline, content profile management, and Docker-based deployment. The system provides administrators with a web-based dashboard to register, monitor, and manage digital signage displays across multiple locations.

## 1.3 Audience
- Software engineers extending the API or adding new frontend features.
- DevOps engineers setting up the deployment environment.
- Reviewers and onboarding engineers building a mental model of the architecture.
- QA engineers designing test cases for the system.
Readers are assumed to be comfortable with Python 3.11+, FastAPI, React 18, MongoDB, and modern REST API patterns.

## 1.4 Problem Statement
Managing a fleet of digital signage displays across distributed locations typically requires manual per-device configuration or expensive proprietary software. This project demonstrates a production-grade open-source management platform that enables administrators to register, monitor, and update displays from a single web dashboard. The system must handle bulk device registration via Excel import, support real-time status tracking, enforce role-based access through JWT authentication, and maintain responsive performance with hundreds of displays.

## 1.5 Objectives
- Provide a secure JWT-based authentication system for administrators.
- Enable CRUD operations for display devices with search and filter capabilities.
- Support bulk upload of displays via Excel files with comprehensive validation.
- Generate downloadable Excel templates and error reports for failed rows.
- Maintain content profile associations across multiple displays.
- Expose a RESTful API with pagination, search, and status filtering.
- Deliver a responsive, theme-aware React UI with Material Design components.
- Containerize the application for consistent deployment environments.

---

# 2. System Overview

## 2.1 Project Overview
Signage OS is a decoupled SPA with an asynchronous REST API backend. The backend uses FastAPI with MongoDB as the document store, interfaced through the Beanie ODM (Motor + Pydantic). The frontend is a Vite + React 18 SPA using MUI v5 for UI components, Redux Toolkit for state management, and React Router v6 for client-side routing. The application supports JWT-based authentication with bcrypt password hashing, display CRUD with pagination and multi-field search, and bulk Excel upload with row-level validation and error reporting.

## 2.2 Features
- **JWT Authentication** — HS256-signed tokens with 8-hour expiry, bcrypt password hashing, login/register/refresh flows.
- **Display Management** — Create, read, update, and delete displays with fields for ID, name, IP address, location, and status.
- **Multi-field Search** — Text search across name, IP address, and location fields with full-text MongoDB indexes.
- **Status Filtering** — Filter displays by ACTIVE, INACTIVE, or MAINTENANCE status.
- **Paginated Responses** — Cursor-free skip/limit pagination with total count and page metadata.
- **Bulk Excel Upload** — Download template, upload .xlsx file, validate row-by-row, preview results, commit valid rows.
- **Failed Rows Export** — Download a generated Excel spreadsheet containing only the failed records with appended error reasons.
- **Content Profiles** — Manage shared content profile definitions that can be linked to multiple displays.
- **Theme Support** — Light and dark mode with persistent preference.
- **Responsive Design** — Adaptive layout for desktop, tablet, and mobile viewports.
- **Rate Limiting** — SlowAPI-based rate limiting on authentication endpoints.
- **Security Headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection via middleware.

## 2.3 Workflow
At a high level: an administrator accesses the login page → enters credentials → backend validates against bcrypt hash → JWT returned → stored in localStorage → attached as Bearer token to all subsequent requests → administrator can view displays, search/filter, create/edit/delete individual displays, or perform a bulk upload via Excel → the bulk upload flow involves downloading a template, uploading the filled file, reviewing a validation preview with per-row error highlighting, committing valid rows to MongoDB, and optionally downloading failed rows as an Excel file for correction.

{{FIGURE: Figure 2.1 — End-to-end system workflow with auth and bulk upload}}

## 2.4 User Roles
- **Administrator** — the sole user role. Authenticated via JWT. Can create, read, update, and delete displays, manage content profiles, and perform bulk uploads. All endpoints require authentication except login and registration.
- **System maintainer** — extends backend APIs, adds frontend features, manages deployment infrastructure, and monitors the database.

---

# 3. System Architecture

## 3.1 High-Level Design (HLD)
Signage OS implements a decoupled frontend/backend architecture. The backend is a FastAPI application that exposes RESTful endpoints protected by JWT authentication. The frontend is a React SPA served by Vite that communicates with the backend via Axios with a Bearer token interceptor. MongoDB serves as the document store, accessed asynchronously through Beanie ODM (built on Motor and Pydantic). The frontend manages application state through three Redux slices (auth, display, upload) and renders responsive MUI v5 components.

{{FIGURE: Figure 3.1 — High-level architecture: frontend, backend, and database layers}}

## 3.2 Low-Level Design (LLD)
The repository is organized by layer: the backend is split into `api/` (routers and dependency injection), `core/` (config, security, database), `models/` (Beanie document definitions), `schemas/` (Pydantic request/response models), and `services/` (business logic, Excel parsing, formatting). The frontend is split into `components/` (common, dashboard, displays, layout), `pages/` (route-level components), `redux/slices/` (auth, display, upload), `services/` (API client and auth service), and `utils/` (validators). The Axios interceptor automatically attaches JWT tokens and handles 401 responses by clearing auth state and redirecting to login.

{{FIGURE: Figure 3.2 — Low-level design: repository structure and component relationships}}

## 3.3 Architecture Diagram

{{FIGURE: Figure 3.3 — Component architecture diagram showing frontend-backend interaction}}

## 3.4 Module Breakdown
```
signage-management-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application, middleware, lifespan
│   │   ├── api/
│   │   │   ├── deps.py              # Dependency: JWT verification, get_current_admin
│   │   │   └── v1/
│   │   │       ├── api.py           # Router aggregation
│   │   │       └── endpoints/
│   │   │           ├── auth.py      # POST /login, /register
│   │   │           ├── displays.py  # CRUD + bulk upload endpoints
│   │   │           └── content_profiles.py
│   │   ├── core/
│   │   │   ├── config.py            # Settings via pydantic-settings
│   │   │   ├── security.py          # JWT create/decode, bcrypt hash/verify
│   │   │   ├── database.py          # Beanie init, health check
│   │   │   ├── exceptions.py        # Custom exceptions (DuplicateDisplayId, ExcelParseError)
│   │   │   ├── error_handlers.py    # Global exception handlers
│   │   │   ├── logger.py            # Logging configuration
│   │   │   └── seed.py              # Initial admin user seeder
│   │   ├── models/
│   │   │   ├── admin.py             # Admin document (Beanie)
│   │   │   ├── display.py           # Display document (Beanie)
│   │   │   └── content_profile.py   # ContentProfile document (Beanie)
│   │   ├── schemas/
│   │   │   ├── auth.py              # TokenResponse, LoginRequest, RegisterRequest
│   │   │   ├── display.py           # DisplayCreate, Update, Response, ListResponse
│   │   │   ├── content_profile.py   # ContentProfile schemas
│   │   │   ├── excel.py             # ValidationResponse, CommitRequest, CommitResponse
│   │   │   └── error.py             # Standardized error response
│   │   └── services/
│   │       ├── display_service.py   # CRUD + pagination business logic
│   │       ├── display_formatter.py # Response formatting with profile expansion
│   │       ├── excel_parser.py      # Excel validation and commit logic
│   │       └── excel_template.py    # Template generation and failed rows export
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
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── main.jsx                 # React entry point
│   │   ├── App.jsx                  # Router configuration
│   │   ├── index.css                # Global styles
│   │   ├── theme.js                 # MUI theme (light/dark)
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/              # ProtectedRoute, ConfirmDeleteDialog, ErrorBoundary,
│   │   │   │                       # EmptyState, ErrorAlert, SearchBar, StatCard, etc.
│   │   │   ├── dashboard/           # SignageKPI, GlobeMap, DonutChart, TopLocations, etc.
│   │   │   ├── displays/            # DisplayTable, DisplayForm, DisplayFormDialog,
│   │   │   │                       # FileDropzone, UploadPreviewTable, UploadSummaryPanel
│   │   │   └── layout/              # DashboardLayout, Sidebar, AppHeader, AIPanel
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DisplaysPage.jsx
│   │   │   ├── DisplayDetailPage.jsx
│   │   │   └── BulkUploadPage.jsx
│   │   ├── redux/
│   │   │   ├── store.js
│   │   │   └── slices/
│   │   │       ├── authSlice.js
│   │   │       ├── displaySlice.js
│   │   │       └── uploadSlice.js
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance + JWT interceptor
│   │   │   ├── authService.js
│   │   │   └── displayService.js
│   │   └── utils/
│   │       └── validators.js
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── .gitignore
└── README.md
```

## 3.5 Data Flow Diagram (DFD)
**Authentication flow:** Browser → LoginPage → POST /api/auth/login → FastAPI → verify bcrypt hash → return JWT → localStorage → Axios interceptor attaches Bearer header → subsequent requests.
**Display CRUD flow:** Browser → DisplaysPage → dispatch fetchDisplays → GET /api/displays?page=&limit=&search=&status= → FastAPI → JWT verification via get_current_admin → Beanie Display.find() → MongoDB → paginated response → Redux store → DisplayTable render.
**Bulk upload flow:** Browser → BulkUploadPage → POST /api/displays/bulk-upload/validate → FastAPI → openpyxl parse → row-by-row validation → ValidationResponse with preview → UploadPreviewTable render → commit valid rows → POST /api/displays/bulk-upload/commit → Display.insert_many() → CommitResponse → UploadSummaryPanel.

{{FIGURE: Figure 3.5 — Data flow diagram showing auth, CRUD, and bulk upload paths}}

## 3.6 Sequence Diagram
A typical display management session: Administrator opens browser → LoginPage renders → enters email/password → loginAdmin thunk dispatched → POST /api/auth/login → backend verifies credentials → returns JWT + expires_at → stored in localStorage → redirect to /displays → DisplaysPage loads → fetchDisplays thunk dispatched → GET /api/displays with Bearer token → backend validates JWT → queries MongoDB via Beanie → returns paginated list → Redux store updated → DisplayTable renders rows with stat cards → administrator can search, filter, edit, delete, or initiate bulk upload.

{{FIGURE: Figure 3.6 — Sequence diagram: complete login to display management session}}

---

# 4. Technology Stack

## 4.1 Core Technologies
- **Python 3.11+** — backend runtime.
- **FastAPI 0.115+** — async REST API framework.
- **Uvicorn** — ASGI server for FastAPI.
- **Pydantic v2** — data validation and serialization for all models.
- **Beanie 1.29+** — async ODM for MongoDB (built on Motor + Pydantic).
- **Motor 3.7+** — async MongoDB driver.
- **MongoDB 7+** — document database.
- **React 18** — frontend SPA library.
- **Vite** — frontend build tool and dev server.
- **MUI v5** — Material Design React component library.
- **Redux Toolkit** — state management with async thunks.

## 4.2 Runtime Technologies
- **Node.js 20+** — JavaScript runtime for frontend build and dev server.
- **JWT (HS256)** — stateless authentication via python-jose.
- **bcrypt** — password hashing via passlib.
- **openpyxl** — Excel file generation and parsing.
- **Axios** — HTTP client with interceptors.
- **React Router v6** — client-side routing with protected routes.

## 4.3 Implementation Technologies
- **Containerization** — Docker and Docker Compose for multi-service deployment.
- **Nginx** — reverse proxy for frontend production build.
- **SlowAPI** — rate limiting middleware for auth endpoints.
- **pytest + httpx** — backend test framework with async support.
- **Vitest + React Testing Library** — frontend test framework.

## 4.4 Libraries and Dependencies
| Dependency | Version | Role |
|---|---|---|
| `fastapi` | `0.115+` | Web framework for REST API |
| `beanie` | `1.29+` | Async MongoDB ODM |
| `motor` | `3.7+` | Async MongoDB driver |
| `pydantic` | `2.x` | Data validation |
| `python-jose` | `3.x` | JWT creation and verification |
| `passlib` | `1.7+` | Password hashing (bcrypt) |
| `openpyxl` | `3.1+` | Excel file generation and parsing |
| `slowapi` | `0.1+` | Rate limiting middleware |
| `react` | `18.x` | Frontend UI library |
| `@mui/material` | `5.x` | Material Design components |
| `@reduxjs/toolkit` | `2.x` | State management |
| `axios` | `1.x` | HTTP client |
| `react-router-dom` | `6.x` | Client-side routing |
| `vite` | `5.x` | Build tool |

## 4.5 External Services / Infrastructure
- **MongoDB Atlas** (optional) — cloud-hosted MongoDB for production deployments.
- **Docker Hub** (optional) — container registry for deployment images.
- No other external services or cloud APIs are required — the system is self-contained.

---

# 5. Installation and Setup

## 5.1 Prerequisites
- Python 3.11 or newer.
- Node.js 20 or newer and npm.
- MongoDB 7+ (local, Docker, or Atlas).
- Docker and Docker Compose (optional, for containerized deployment).

## 5.2 System Requirements
- OS: Linux, macOS, or Windows (developed cross-platform).
- Memory: 512 MB minimum for backend + 1 GB minimum for frontend build.
- Disk: 500 MB for application code and dependencies; scales with display data in MongoDB.
- Database: MongoDB instance accessible via connection string.

## 5.3 Environment Setup
The application uses environment variables for configuration. Copy `.env.example` to `.env` in the backend directory and configure MongoDB URL and JWT secret. The frontend uses Vite environment variables prefixed with `VITE_` for API base URL configuration.

## 5.4 Installation Steps
```bash
# Clone the repository
cd signage-management-app

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows
pip install -r requirements.txt
cp .env.example .env      # Edit .env with your MongoDB URL and JWT secret

# Seed initial admin user
python -c "from app.core.seed import seed_admin; import asyncio; asyncio.run(seed_admin())"

# Start backend
uvicorn app.main:app --reload --port 8000

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env      # Edit VITE_API_BASE_URL if needed
npm run dev
```

## 5.5 Configuration Parameters
| Setting | Default | Purpose |
|---|---|---|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB_NAME` | `signage_db` | MongoDB database name |
| `JWT_SECRET_KEY` | (required) | Secret for HS256 JWT signing |
| `JWT_ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | JWT expiry (8 hours) |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API base URL |
| `MAX_FILE_SIZE` | `10MB` | Maximum Excel upload size |

## 5.6 Environment Variables
```bash
# Backend (.env)
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DB_NAME=signage_db
JWT_SECRET_KEY=your-secure-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8000
```

---

# 6. Database Design

## 6.1 Entity Relationship Diagram (ERD)
The database uses MongoDB with three document collections: `displays`, `content_profiles`, and `admins`. Displays reference Content Profiles via Beanie `Link` fields for normalized relationships. Each collection has appropriate indexes for query performance and uniqueness constraints.

{{FIGURE: Figure 6.1 — Database relationship diagram: Displays, ContentProfiles, and Admin}}

## 6.2 Data Schema
The core data structures are defined as Beanie Document models:

**Admin:** Stores administrator credentials with bcrypt-hashed password, email (unique), and active status.
**Display:** Stores display device information with `display_id` (unique human-readable identifier), name, IP address, location, status (ACTIVE/INACTIVE/MAINTENANCE), linked content profiles, and timestamps.
**ContentProfile:** Stores content profile definitions with name (unique), description, priority level (CRITICAL/HIGH/MEDIUM/LOW), and creation timestamp.

## 6.3 Artifact / Collection Structure
| Collection | Key Fields | Indexes |
|---|---|---|
| `admins` | `username` (unique), `hashed_password`, `is_active` | Unique on `username` |
| `displays` | `display_id` (unique), `name`, `ip_address`, `location`, `status`, `content_profiles` (Link[]) | Unique on `display_id`; Compound text index on `name`, `location`, `ip_address` |
| `content_profiles` | `name` (unique), `description`, `priority` | Unique on `name` |

## 6.4 Relationships and Constraints
- Each `display_id` must be unique across all displays (enforced by unique index and validation logic).
- Displays reference Content Profiles via `Link[ContentProfile]` — profiles can be shared across multiple displays.
- Content profiles are auto-created during bulk upload if they do not exist.
- Display status is constrained to ACTIVE, INACTIVE, or MAINTENANCE (enforced by regex pattern).
- IP addresses must match valid IPv4 or IPv6 patterns.
- Cascade delete is not implemented — content profiles must be managed independently.

---

# 7. API Documentation

## 7.1 HTTP API (FastAPI)

### POST /api/auth/login
Authenticates an administrator and returns a JWT.
**Request body:**
```json
{
  "username": "admin@example.com",
  "password": "your-password"
}
```
**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_at": "2026-07-22T14:23:14Z",
  "username": "admin@example.com"
}
```
**Failure:** 401 Unauthorized — invalid credentials.

### POST /api/auth/register
Registers a new administrator and returns a JWT.
**Request body:** (same as login)
**Response (200 OK):** (same as login)
**Failure:** 400 Bad Request — duplicate email or validation error.

### GET /api/displays
Retrieves a paginated list of displays with optional search and status filter.
**Query parameters:** `page` (int, default 1), `limit` (int, default 10, max 100), `search` (str, optional), `status` (ACTIVE|INACTIVE|MAINTENANCE, optional).
**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "60d5ec49f1b29a2e6840723a",
      "display_id": "DSP-001",
      "name": "Main Entrance Lobby Screen",
      "ip_address": "192.168.1.50",
      "location": "Mall Concourse, Entrance 1",
      "status": "ACTIVE",
      "content_profiles": [
        { "id": "...", "name": "Emergency Alert Broadcast", "priority": "HIGH" }
      ],
      "created_at": "2026-07-22T10:00:00Z"
    }
  ],
  "pagination": { "total": 124, "page": 1, "limit": 10, "pages": 13 }
}
```
**Failure:** 401 Unauthorized — missing or expired JWT.

### POST /api/displays
Creates a single display.
**Request body:** `display_id` (required, unique), `name` (required), `ip_address` (required, valid IPv4/IPv6), `location` (required), `status` (optional, default ACTIVE), `content_profiles` (optional, list of profile names).
**Response (201 Created):** Created display object with populated profile links.
**Failure:** 400 Bad Request — duplicate `display_id` or validation error.

### PUT /api/displays/{id}
Updates an existing display.
**Request body:** Same fields as POST, all optional.
**Response (200 OK):** Updated display object.

### DELETE /api/displays/{id}
Deletes a display.
**Response (204 No Content).**

### GET /api/displays/{id}
Retrieves a single display by its MongoDB ObjectId.
**Response (200 OK):** Display object.
**Failure:** 404 Not Found.

### GET /api/displays/bulk-upload/template
Downloads an empty Excel template (.xlsx) with predefined columns and validation rules.
**Response:** File attachment stream (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet).

### POST /api/displays/bulk-upload/validate
Parses an uploaded Excel file and returns a validation preview with per-row errors.
**Request:** Multipart form data with field `file` (.xlsx, max 10MB).
**Response (200 OK):**
```json
{
  "is_valid": false,
  "summary": { "total_rows": 5, "valid_rows": 3, "failed_rows": 2 },
  "preview": [
    {
      "row_number": 2,
      "is_valid": true,
      "data": { "display_id": "DSP-101", "name": "Loading Dock Screen 1", ... },
      "errors": []
    },
    {
      "row_number": 3,
      "is_valid": false,
      "data": { ... },
      "errors": [
        { "field": "ip_address", "message": "Invalid IP address format" }
      ]
    }
  ]
}
```
**Failure:** 422 Unprocessable Entity — structural errors (missing columns, invalid file format).

### POST /api/displays/bulk-upload/commit
Commits validated rows to the database.
**Request body:** `{"rows": [...]}` — list of validated row data objects.
**Response (200 OK):**
```json
{
  "inserted": 3,
  "failed": 0,
  "total": 3,
  "errors": []
}
```

### POST /api/displays/bulk-upload/failed-rows
Generates and downloads an Excel file containing only the failed rows with error descriptions.
**Request body:** `{"rows": [...]}` — list of failed row objects with data and errors.
**Response:** File attachment stream (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet).

### GET /api/content-profiles
Lists all content profiles.
**Response (200 OK):** Array of content profile objects.

### POST /api/content-profiles
Creates a new content profile.
**Request body:** `name` (required, unique), `description` (optional), `priority` (optional, default MEDIUM).
**Response (201 Created):** Created content profile.

### PUT /api/content-profiles/{id}
Updates an existing content profile.
**Response (200 OK):** Updated content profile.

### DELETE /api/content-profiles/{id}
Deletes a content profile.
**Response (204 No Content).**

## 7.2 Authentication
All endpoints except `POST /api/auth/login` and `POST /api/auth/register` require JWT authorization. The JWT must be attached as a Bearer token: `Authorization: Bearer <token>`. Tokens expire after 8 hours (480 minutes). On expiration, the frontend clears auth state and redirects to the login page.

## 7.3 Error Handling and Status Codes
| Scenario | HTTP Status | Response | User-Facing Action |
|---|---|---|---|
| Invalid credentials | 401 | `{"detail": "Incorrect username or password"}` | Highlight form inputs |
| Token expired | 401 | `{"detail": "Token expired"}` | Redirect to login |
| Duplicate display ID | 400 | `{"detail": "Display ID already exists"}` | Error banner in form |
| Excel column missing | 422 | `{"detail": "Missing column: display_id"}` | Error card above dropzone |
| Cell format mismatch | 422 | Detailed row validation list | Red highlight in preview table |
| DB outage | 503 | `{"detail": "Database connection timeout"}` | Retry banner |

---

# 8. Usage Guide

## 8.1 User Interface Overview
The application provides a single-page web interface with the following main views:
1. **Login** — purple gradient background with centered white card, email and password fields, show/hide password toggle, remember me checkbox, sign up toggle.
2. **Displays** — paginated table with search bar, status filter, stat cards (total/active/maintenance/inactive), display status donut chart, 3D globe network visualization, add/edit/delete display dialogs.
3. **Display Detail** — full information view for a single display with edit capability.
4. **Bulk Upload** — 4-step wizard: download template → upload file → review & validate → complete with summary statistics and failed rows download.

{{FIGURE: Figure 8.1 — Web interface: main views and navigation}}

## 8.2 User Authentication
On first access, users are redirected to `/login`. After successful authentication (login or registration), a JWT is stored in localStorage and the user is redirected to `/displays`. The sidebar shows the authenticated user's email and a logout button with red styling. On logout, the JWT is removed from localStorage and the user returns to the login page. Protected routes redirect unauthenticated users to the login page with return-path preservation.

## 8.3 Dashboard Overview
The dashboard (at the `/` route during development) provides a high-level overview with:
- **KPI cards** — total displays, active, maintenance, inactive, and location counts.
- **Display status donut chart** — proportional breakdown of display statuses with MUI X PieChart.
- **Top locations** — bar visualization of display distribution across locations.
- **3D globe** — CSS-perspective globe with animated wireframe rings, pulsing city pins, and city name labels.

{{FIGURE: Figure 8.2 — Dashboard workflow and component layout}}

## 8.4 Core Functionalities
- **Display CRUD** — administrators can create, read, update, and delete displays through a responsive table interface with inline status chips.
- **Search and filter** — real-time text search across name, IP address, and location fields; status dropdown filter for ACTIVE/INACTIVE/MAINTENANCE.
- **Bulk upload** — four-step guided wizard: template download, file upload with drag-and-drop, validation preview with per-row error highlighting, and commit with success statistics.
- **Failed rows export** — after validation, administrators can download an Excel file containing only the failed rows with error messages appended as an additional column.
- **Content profiles** — manage shared profile definitions with name, description, and priority level.

## 8.5 Advanced Features
- **Theme switching** — light and dark mode with persistent preference via ThemeContext.
- **AI insights panel** — sidebar component with animated robot icon, cycling typing-effect diagnosis messages, and dynamic display health analysis (inactive/maintenance counts, duplicate ID detection).
- **3D globe visualization** — CSS-only 3D globe with animated wireframe rings and pulsing city markers for geographic display distribution.
- **Keyboard shortcuts** — accessible form controls and navigation.
- **Responsive design** — adaptive grid layout for mobile, tablet, and desktop viewports.

## 8.6 Troubleshooting
- **Login fails** — verify credentials are correct; check that the backend is running and MongoDB is accessible.
- **Token expired** — automatically handled by the Axios interceptor; user is redirected to login.
- **Bulk upload fails** — check file is .xlsx format, under 10MB, and has the correct column headers.
- **Display creation fails** — verify display_id is unique and all required fields are filled correctly.
- **Backend not responding** — check uvicorn process and MongoDB connection; verify CORS settings.
- **Frontend shows blank page** — check browser console for errors; verify VITE_API_BASE_URL is correct.

---

# 9. Security and Scalability

## 9.1 Authentication Mechanism
JWT-based authentication using HS256 algorithm. Passwords are hashed with bcrypt via passlib's CryptContext. Tokens have a strict 8-hour (480-minute) expiry enforced both at creation and verification. The JWT secret key is loaded from environment configuration and must be set to a secure value in production.

## 9.2 Authorization and Role-Based Access
All API endpoints (except login and register) require JWT authorization via the `get_current_admin` dependency. The dependency extracts the Bearer token, decodes and verifies it, loads the corresponding Admin document from MongoDB, and returns it or raises a 401 error. No role-based access control is implemented — all authenticated administrators have full access.

## 9.3 Data Security
- Passwords stored as bcrypt hashes, never in plaintext.
- JWT tokens signed with HS256 using an environment-configured secret key.
- MongoDB connection uses standard authentication; connection strings include credentials.
- Excel upload files are limited to 10MB to prevent DoS attacks.
- Input sanitization via Pydantic validators on all API endpoints.
- Security headers set by middleware: X-Content-Type-Options (nosniff), X-Frame-Options (DENY), X-XSS-Protection (1; mode=block).
- CORS middleware configured for frontend origin.
- Rate limiting (5 requests/minute) on authentication endpoints via SlowAPI.

## 9.4 Rate Limiting and Validation
- **Rate limiting:** 5 requests per minute on `/api/auth/login` and `/api/auth/register` to prevent brute-force attacks.
- **Input validation:** Pydantic models with regex patterns, length constraints, and type validation on all request bodies and query parameters.
- **Excel validation:** Extension check (.xlsx only), file size limit (10MB), structural validation (required columns, sheet presence), row-by-row field validation with cross-reference against database for uniqueness.

## 9.5 Scalability Approach
- **Pagination:** All list endpoints use skip/limit pagination with configurable page size (max 100).
- **Text search:** MongoDB text indexes on name, location, and IP address fields for efficient multi-field search.
- **Bulk operations:** Excel commit uses `Display.insert_many()` for batch insert rather than per-document writes.
- **Stateless auth:** JWT tokens enable horizontal scaling without shared session state.
- **Async I/O:** FastAPI's async request handling with Motor's async MongoDB driver prevents blocking.
- **Containerization:** Docker and Docker Compose enable consistent scaling across environments.

{{FIGURE: Figure 9.5 — Deployment and execution model}}

---

# 10. Testing

## 10.1 Test Plan
The test suite covers backend unit tests, API integration tests, Redux state management tests, and frontend UI component tests. Backend tests use pytest with httpx AsyncClient for API integration. Frontend tests use Vitest with React Testing Library and a custom Redux test wrapper.

## 10.2 Test Cases

{{FIGURE: Figure 10.2 — Test case matrix}}

Key test areas:
- Backend unit: Excel parsing with valid and invalid payloads, password hashing/verification, JWT creation and decoding.
- API integration: Auth flow (login with correct and incorrect credentials), protected endpoint access with and without Bearer headers, CRUD endpoints with constraints (duplicate ID returns 400).
- Redux: Store actions dispatch correctly during pending, fulfilled, and rejected statuses for all three slices.
- UI: Validation error highlights on Excel upload preview table, responsive grid layout on mobile/tablet viewports.

## 10.3 Unit Testing
Backend unit tests cover:
- `test_excel_parser.py` — validates Excel parsing with mock valid/invalid files.
- `test_security.py` — validates password hashing, verification, and JWT create/decode operations.
Each test uses pytest fixtures and runs against the actual code in isolation.

## 10.4 Integration Testing
API integration tests use FastAPI's TestClient (wrapped with httpx AsyncClient for async endpoints):
- `test_auth_api.py` — login with valid credentials, login with invalid credentials, register duplicate email.
- `test_displays_api.py` — CRUD operations with auth, duplicate ID rejection, search and filter, pagination.
- `test_bulk_upload_api.py` — template download, validate with valid/invalid Excel, commit valid rows.

## 10.5 Test Results

{{FIGURE: Figure 10.5 — Test run / smoke-test report}}

---

# 11. Deployment

## 11.1 Deployment Architecture
The application is containerized using Docker with two services: the FastAPI backend and the Vite-built React frontend served by Nginx. MongoDB runs as a separate container for local development, or connects to a managed MongoDB Atlas instance in production. Docker Compose orchestrates the multi-service deployment.

{{FIGURE: Figure 11.1 — Docker-based deployment architecture}}

## 11.2 CI/CD Pipeline

{{FIGURE: Figure 11.2 — CI/CD pipeline}}

## 11.3 Docker/Kubernetes Setup
The project includes `docker-compose.yml` for development and `docker-compose.prod.yml` for production. The backend Dockerfile uses a multi-stage Python build. The frontend Dockerfile uses a multi-stage Node.js build with Nginx serving the static assets. MongoDB configuration includes persistent volume mounts and initialization scripts.

## 11.4 Deployment Steps
```bash
# Development
docker compose up -d

# Production
cp .env.example .env   # Configure production environment variables
docker compose -f docker-compose.prod.yml up -d

# The application is available at http://localhost:3000 (frontend)
# The API is available at http://localhost:8000 (backend)
```

## 11.5 Release Notes
- **Version 1.0.0** — Initial production release with JWT auth, display CRUD, bulk Excel upload with validation and failed rows export, content profiles, responsive MUI v5 frontend, and Docker deployment.

## 11.6 Known Issues and Limitations
- **Single admin user model** — no multi-tenant or multi-role support.
- **No audit logging** — display changes are not logged with timestamps or user attribution.
- **No WebSocket support** — display status updates require manual refresh or polling.
- **Local file storage** — uploaded Excel files are processed in memory and not persisted.
- **No backup/restore** — no built-in database backup mechanism.
- **Rate limiting on auth only** — other endpoints are not rate-limited.

---

# 12. Support and Maintenance

## 12.1 Troubleshooting Guide
See §8.6 for common issues. For API-level problems, check the FastAPI auto-generated docs at `/docs`. For database issues, verify MongoDB connection string and network access. For frontend issues, check browser developer console for API errors or React rendering warnings.

## 12.2 Frequently Asked Questions (FAQs)
- **How do I reset the admin password?** Run the seed script again or update the database directly with a new bcrypt hash.
- **Can I add multiple administrators?** Yes — use the /register endpoint or add documents directly to the admins collection.
- **What happens when a JWT expires?** The Axios interceptor catches the 401, clears auth state, and redirects to login.
- **Can I customize the Excel upload template?** Yes — modify the column definitions in `excel_template.py` and update validation in `excel_parser.py`.
- **How do I add a new display status?** Update the regex pattern in both the Display model and the API query validation.

## 12.3 Maintenance Process
- Backend changes go in `backend/app/` following the existing layer structure.
- Frontend changes go in `frontend/src/` following the existing component/page/slice/service pattern.
- Database schema changes require corresponding updates to Beanie models and migration scripts.
- API contract changes require updates to schemas, endpoints, and frontend service calls.

## 12.4 Contact Information
> To be completed (team / repository owners).

---

# 13. Future Enhancements

## 13.1 Planned Features
- Real-time display status updates via WebSocket connections.
- Multi-admin and role-based access control (RBAC).
- Audit logging for all display and configuration changes.
- Scheduled content profile deployment to displays.
- Display grouping and bulk status updates.
- Email/SMS alerting for display offline events.

## 13.2 Improvement Areas
- Add comprehensive end-to-end test suite.
- Implement database backup and restore utilities.
- Add API versioning for backward compatibility.
- Support for additional Excel formats (.xls, .csv).
- Performance optimization for large-scale deployments (1000+ displays).
- Enhanced error reporting with structured logging and monitoring.

---

# 14. Change Log

## 14.1 Version History
| Version | Date | Summary |
|---|---|---|
| 1.0.0 | 2026-07 | Initial production release with JWT auth, display CRUD, bulk Excel upload with validation, content profiles, responsive MUI v5 frontend, and Docker deployment |

## 14.2 Change Summary
Initial release implements the complete digital signage management platform with FastAPI backend (MongoDB/Beanie, JWT auth, display CRUD, bulk Excel upload with validation and failed rows export, content profiles) and React frontend (MUI v5, Redux Toolkit, responsive design, dark/light theme, 3D globe visualization, AI insights panel).

---

# 15. References

## 15.1 Documentation References
- `/docs/00-INDEX.md` — master task planner with phase breakdown.
- `/docs/01-phase-setup.md` through `/docs/11-phase-deploy.md` — phase-by-phase implementation guides.
- `/README.md` — user-facing documentation and quick start.
- `/backend/README.md` — backend-specific documentation.
- `/frontend/README.md` — frontend-specific documentation.

## 15.2 External Resources
- FastAPI documentation — https://fastapi.tiangolo.com/
- Beanie ODM documentation — https://beanie-odm.dev/
- MUI v5 documentation — https://mui.com/material-ui/
- Redux Toolkit documentation — https://redux-toolkit.js.org/
- MongoDB documentation — https://www.mongodb.com/docs/
- PlantUML documentation — https://plantuml.com/
- openpyxl documentation — https://openpyxl.readthedocs.io/
- React Router documentation — https://reactrouter.com/
