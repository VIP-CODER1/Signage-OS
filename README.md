# Signage-OS : Digital Signage Display Management System

A full-stack web application for managing digital signage displays with bulk upload via Excel.

<img width="1915" height="870" alt="image" src="https://github.com/user-attachments/assets/22ce0d98-cfb1-48eb-9347-4ac674d5be07" />

<img width="1917" height="876" alt="Screenshot 2026-07-23 025003" src="https://github.com/user-attachments/assets/8f3f196a-296c-4284-95ca-e0567991c822" />



## Tech Stack

- **Backend:** Python 3.11, FastAPI, MongoDB (Motor/Beanie ODM)
- **Frontend:** React 18, Vite, MUI v5, Redux Toolkit, React Router
- **Infrastructure:** Docker Compose (MongoDB + API + Nginx)

## Prerequisites

- Docker & Docker Compose
- Python 3.11+ (manual setup)
- Node.js 20+ (manual setup)

## Quick Start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### Seed Data

```bash
docker exec -it signage-backend python -m app.core.seed
```

Default admin: `admin@example.com` / `SecurePassword123`

## Manual Setup

**Backend:**

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Testing

```bash
# Backend (requires MongoDB)
cd backend && pytest tests/ -v --cov=app

# Frontend
cd frontend && npx vitest run
```

## Architecture

```
signage-management-app/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── api/v1/    # Route handlers
│   │   ├── core/      # Config, security, DB
│   │   ├── models/    # Beanie ODM documents
│   │   ├── schemas/   # Pydantic validation
│   │   └── services/  # Business logic
│   └── tests/
├── frontend/          # Vite + React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   └── services/
│   └── public/
├── docs/              # Architecture & planning docs
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Admin login |
| GET | `/api/displays` | JWT | List (paginated, search, filter) |
| POST | `/api/displays` | JWT | Create display |
| GET | `/api/displays/{id}` | JWT | Get display |
| PUT | `/api/displays/{id}` | JWT | Update display |
| DELETE | `/api/displays/{id}` | JWT | Delete display |
| GET | `/api/displays/bulk-upload/template` | JWT | Download Excel template |
| POST | `/api/displays/bulk-upload/validate` | JWT | Validate Excel file |
| POST | `/api/displays/bulk-upload/commit` | JWT | Commit validated rows |
| GET/POST/PUT/DELETE | `/api/content-profiles` | JWT | Content profile CRUD |

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all configuration options.

## Production Deployment

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## Documentation

See the [docs/](./docs/) directory for architecture decisions, API specs, and setup guides.
