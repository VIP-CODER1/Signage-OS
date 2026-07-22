# Digital Signage Display Management Application — Master Task Planner

> **Source:** `digital_signage_display_management_design_specification_1.pdf`  
> **Tech Stack:** FastAPI + MongoDB/Beanie (backend) | Vite + React + MUI v5 + Redux Toolkit (frontend)  
> **Architecture:** Decoupled SPA with asynchronous REST API + JWT auth

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend Framework | **FastAPI** (Python 3.11+) | Async REST API |
| Database | **MongoDB** | Document store |
| ODM | **Beanie** (Motor + Pydantic) | Async MongoDB interface |
| Auth | **JWT (HS256) + bcrypt (passlib)** | Stateless auth, 8hr expiry |
| Frontend Framework | **React 18** | SPA UI |
| Build Tool | **Vite** | Fast dev/build |
| UI Library | **MUI v5** | Material Design components |
| State Management | **Redux Toolkit** | 3 slices: auth, display, upload |
| Forms | **React Hook Form** | Form validation |
| Routing | **React Router v6** | Client-side routing |
| Excel | **openpyxl** (backend) | Template gen + parsing |
| HTTP Client | **Axios** | API calls + interceptors |
| Containerization | **Docker** | Deployment |

---

## Agent Assignments Map

| Agent | Primary Phase(s) | Role |
|-------|-----------------|------|
| `researcher` | Phase 0, 9 | Verify latest FastAPI/Beanie/MUI API docs |
| `reviewer` | All phases | Code review before merging each phase |
| `refactoring-expert` | Phase 3, 6 | Cleanup after features land |
| `security-auditor` | Phase 2, 4, 9 | Auth & upload security audit |
| `test-runner` | Phase 8 | Run/fix test suites |

## Skills Map

| Skill | When to invoke |
|-------|---------------|
| `spec` | Reference when implementing any phase |
| `pr` | When merging phase branches |
| `validate-and-fix` | After each phase implementation |

---

## Phase Breakdown

| # | Phase | File | Effort | Dependencies | Spec § |
|---|-------|------|--------|-------------|--------|
| 0 | Project Setup & Scaffolding | [01-phase-setup.md](01-phase-setup.md) | 6-8 hrs | None | §2 |
| 1 | Database Design & Models | [02-phase-database.md](02-phase-database.md) | 4-6 hrs | Phase 0 | §3 |
| 2 | Authentication System | [03-phase-auth.md](03-phase-auth.md) | 6-8 hrs | Phase 0, 1 | §4.1 |
| 3 | Display CRUD APIs | [04-phase-crud.md](04-phase-crud.md) | 8-10 hrs | Phase 0, 1, 2 | §4.2 |
| 4 | Bulk Upload System | [05-phase-upload.md](05-phase-upload.md) | 10-12 hrs | Phase 0, 1, 2, 3 | §4.3, §6 |
| 5 | Frontend Architecture & Redux | [06-phase-frontend-arch.md](06-phase-frontend-arch.md) | 6-8 hrs | Phase 0 | §5, §5.1 |
| 6 | Frontend Pages & Components | [07-phase-frontend-pages.md](07-phase-frontend-pages.md) | 12-16 hrs | Phase 5 | §5.2, §5.3, §6.3 |
| 7 | Error Handling & Recovery | [08-phase-error-handling.md](08-phase-error-handling.md) | 6-8 hrs | Phase 6 | §7 |
| 8 | Testing | [09-phase-testing.md](09-phase-testing.md) | 10-12 hrs | All Phases | §9 |
| 9 | Security & Performance | [10-phase-security-perf.md](10-phase-security-perf.md) | 6-8 hrs | All Phases | §8 |
| 10 | Polish, Docker & Deployment | [11-phase-deploy.md](11-phase-deploy.md) | 6-8 hrs | All Phases | §10 |

**Total Estimated Effort:** ~80–104 hours (maximum thoroughness)

---

## Recommended Execution Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
                              ↓
Phase 0 → Phase 5 → Phase 6 → Phase 7
                              ↓
          Phase 8 → Phase 9 → Phase 10
```

**Parallel tracks available:**
- **Backend:** Phases 0 → 1 → 2 → 3 → 4
- **Frontend:** Phases 0 → 5 → 6 → 7

If working solo: backend first, then frontend. If pair: both in parallel.

---

## Content Profiles Endpoint (Spec Gap Filled)

The spec §2 directory structure includes `backend/app/api/v1/endpoints/content_profiles.py` — a CRUD endpoint for managing ContentProfile documents. This is **not covered in any existing backend phase** but is **planned in** [Phase 6 §6.8](07-phase-frontend-pages.md#68-content-profiles-endpoint-backend-gap). Implement as a lightweight task (~1 hr) after Phase 3 or before Phase 4.

---

## Key Acceptance Criteria (from spec §10)

1. **Auth:** Login → JWT → attach to requests → logout clears
2. **CRUD:** Admin can create, read, update, delete displays; search updates results in real-time
3. **Bulk Upload:** Template download → upload valid Excel → preview → commit  
   Invalid Excel → flagged rows with inline errors  
   Download failed records as Excel with error reasons
4. **Quality:** Responsive, empty states, loading indicators, graceful failure handling, no hardcoded credentials

---

## Implementation Notes from Spec Cross-Reference

### Spec Requirements Not in Original Phase 0–5 Plans (Added in Phase 6–10)

| Spec § | Requirement | Where Planned |
|--------|-------------|---------------|
| §2 | `content_profiles.py` endpoint | Phase 6 §6.8 |
| §2 | `validators.js` frontend utility | Phase 6 §6.1.2 |
| §5 | `DisplayTable`, `DisplayFormDialog`, `ConfirmDeleteDialog` components | Phase 6 §6.3–6.4 |
| §5 | `FileDropzone`, `UploadPreviewTable`, `UploadSummaryPanel` components | Phase 6 §6.7 |
| §7 | Error recovery matrix (6 scenarios) | Phase 7 (full doc) |
| §8.1 | Bulk inserts via `insert_many()` | Phase 9 §9.2.1 |
| §8.1 | Async parsing optimization | Phase 9 §9.2.3 |
| §8.2 | Rate limiting, security headers | Phase 9 §9.1.5–6 |
| §8.2 | Excel DoS safeguards (max rows, cell limits) | Phase 9 §9.1.4 |
| §9 | Test matrix (unit, integration, Redux, UI) | Phase 8 (full doc) |
| §10 | Final acceptance criteria verification | Phase 10 §10.6 |

### Spec Components That Already Match Existing Plans

| Spec § | Requirement | Where Covered |
|--------|-------------|---------------|
| §2 | Directory structure | Phase 0 |
| §3 | Database models | Phase 1 |
| §4.1 | Auth endpoints | Phase 2 |
| §4.2 | Display CRUD | Phase 3 |
| §4.3, §6 | Bulk upload + Excel validation | Phase 4, Phase 5 |
| §5.1 | Redux slices (auth, display, upload) | Phase 5 |
| §5.1 | Store shape and thunks | Phase 5 |
| §6.1–6.2 | Excel column spec + parsing rules | Phase 4 |