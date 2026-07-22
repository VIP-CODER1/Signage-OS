# Phase 0: Project Setup & Scaffolding

> **Effort:** 6–8 hours (max) | **Depends on:** Nothing | **Agent:** researcher (verify latest deps)

---

## Objective

Create the monorepo with decoupled `backend/` (FastAPI) and `frontend/` (Vite + React) directories, install all dependencies, verify both apps start, and set up Docker.

---

## 0.1 Monorepo Root Structure

```
signage-management-app/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/  # (empty for now)
│   │   │       └── api.py
│   │   ├── core/               # config, security, database
│   │   ├── models/             # Beanie document models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic
│   │   └── main.py             # FastAPI entry point
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Vite + React SPA
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   └── displays/
│   │   ├── pages/
│   │   ├── redux/
│   │   │   └── slices/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml          # MongoDB + backend + frontend
├── .gitignore
└── README.md
```

---

## 0.2 Backend Setup

### Step 1: Create `backend/` and virtual environment

```bash
mkdir -p backend/app/{api/v1/endpoints,core,models,schemas,services}
mkdir -p backend/tests
cd backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
```

### Step 2: `backend/requirements.txt`

```txt
fastapi==0.115.0
uvicorn[standard]==0.30.6
motor==3.6.0
beanie==1.27.0
pydantic[email]==2.9.0
pydantic-settings==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
openpyxl==3.1.5
httpx==0.27.0
pytest==8.3.0
pytest-asyncio==0.24.0
```

> **Agent call:** Invoke `researcher` to verify latest stable versions of FastAPI, Beanie, Motor, and Pydantic compatibility.

```bash
pip install -r requirements.txt
```

### Step 3: `backend/app/main.py` — Skeleton

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="Digital Signage Display Management API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
```

### Step 4: `backend/app/core/config.py` — Settings

```python
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Digital Signage API"
    DEBUG: bool = True

    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "signage_db"

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production-use-env-var"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]

    # Upload
    MAX_UPLOAD_SIZE_MB: int = 10

    class Config:
        env_file = ".env"

settings = Settings()
```

### Step 5: Verify backend starts

```bash
cd backend && uvicorn app.main:app --reload --port 8000
# Visit http://localhost:8000/docs — Swagger should load
```

---

## 0.3 Frontend Setup

### Step 1: Scaffold with Vite

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
```

### Step 2: Install dependencies

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @reduxjs/toolkit react-redux react-router-dom axios react-hook-form
npm install @hookform/resolvers yup
```

### Step 3: `frontend/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### Step 4: Verify frontend starts

```bash
cd frontend && npm run dev
# Visit http://localhost:5173
```

---

## 0.4 Docker Setup

### `docker-compose.yml` (root)

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    container_name: signage-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: signage_db

  backend:
    build: ./backend
    container_name: signage-backend
    ports:
      - "8000:8000"
    environment:
      MONGODB_URL: mongodb://mongodb:27017
      MONGODB_DB_NAME: signage_db
      JWT_SECRET_KEY: dev-secret-change-in-prod
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    container_name: signage-frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend

volumes:
  mongo_data:
```

### `backend/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 0.5 `.gitignore` (root)

```gitignore
# Python
__pycache__/
*.py[cod]
venv/
.env

# Node
node_modules/
dist/

# IDE
.vscode/
.idea/

# Docker
mongo_data/

# OS
.DS_Store
Thumbs.db
```

---

## 0.6 `README.md` (root)

Minimal README with:
- Project name + one-line description
- Prerequisites (Python 3.11+, Node 18+, Docker)
- Quick start: `docker-compose up` or manual steps
- Links to docs/

---

## Verification Checklist

- [ ] `docker-compose up` starts MongoDB, backend, frontend
- [ ] Backend health check: `curl http://localhost:8000/api/health` → `{"status": "ok"}`
- [ ] Swagger docs loads at `http://localhost:8000/docs`
- [ ] Frontend hot reload works at `http://localhost:5173`
- [ ] Vite proxy forwards `/api/*` to backend
- [ ] `.gitignore` covers all generated files

---

## Agent Dispatch for This Phase

| Agent | Task |
|-------|------|
| `researcher` | Verify latest `fastapi`, `beanie`, `motor`, `pydantic`, `openpyxl` stable versions; return exact pip pins |
| `reviewer` | After scaffolding, review that folder structure matches spec §2 exactly |