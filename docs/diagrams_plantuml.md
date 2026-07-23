# PlantUML Diagrams for Signage OS Technical Documentation

Copy each diagram into https://www.plantuml.com/plantuml/uml/ to render.

---

## Figure 2.1 — End-to-End System Workflow

```plantuml
@startuml
|Administrator|
start
:Login to Signage OS;
|Frontend|
:Authenticate via JWT;
|Backend|
:Validate credentials;
if (Success?) then (yes)
  :Return JWT token;
  |Frontend|
  :Store token in localStorage;
  :Redirect to dashboard;
  :View/manage displays;
  if (Bulk upload?) then (yes)
    :Download Excel template;
    :Fill and upload file;
    |Backend|
    :Validate Excel rows;
    if (Validation passed?) then (yes)
      :Preview valid rows;
      |Frontend|
      :Review preview data;
      :Click Commit;
      |Backend|
      :Insert displays to MongoDB;
      :Return success summary;
      |Frontend|
      if (Failed rows exist?) then (yes)
        :Download failed rows Excel;
      endif
      :Upload complete;
    else (no)
      :Return error details;
      |Frontend|
      :Show validation errors;
      :Fix and re-upload;
    endif
  else (no)
    :Create/edit/delete displays;
  endif
else (no)
  |Frontend|
  :Show error message;
  :Retry login;
endif
stop
@enduml
```

---

## Figure 3.1 — High-Level Architecture

```plantuml
@startuml
!define RECTANGLE class

skinparam packageStyle rectangle
skinparam rectangle {
  BackgroundColor #E8F0FE
  BorderColor #1A73E8
  FontColor #1A73E8
}

package "Frontend (React SPA)" {
  [React Components + MUI v5]
  [Redux Toolkit Slices]
  [Axios Client with JWT Interceptor]
}

package "Backend (FastAPI)" {
  [FastAPI Routers / Controllers]
  [JWT Auth Middleware]
  [Excel Parser / OpenPyXL]
  [Business Logic / Services]
  [Beanie ODM / Motor]
}

database "MongoDB" {
  [Displays Collection]
  [Content Profiles Collection]
  [Admins Collection]
}

[React Components + MUI v5] --> [Redux Toolkit Slices] : dispatches actions
[Redux Toolkit Slices] --> [Axios Client with JWT Interceptor] : async thunks
[Axios Client with JWT Interceptor] --> [FastAPI Routers / Controllers] : HTTP requests (Bearer JWT)
[FastAPI Routers / Controllers] --> [JWT Auth Middleware] : validates token
[FastAPI Routers / Controllers] --> [Excel Parser / OpenPyXL] : bulk upload
[FastAPI Routers / Controllers] --> [Business Logic / Services] : CRUD operations
[Excel Parser / OpenPyXL] --> [Business Logic / Services] : validated rows
[Business Logic / Services] --> [Beanie ODM / Motor] : queries
[Beanie ODM / Motor] --> [MongoDB] : async I/O
@enduml
```

---

## Figure 3.2 — Low-Level Design: Repository Structure

```plantuml
@startuml
package "backend/" {
  package "app/" {
    [main.py] -down-> [api/]
    [main.py] -down-> [core/]
    package "api/" {
      package "v1/" {
        package "endpoints/" {
          [auth.py]
          [displays.py]
          [content_profiles.py]
        }
        [api.py]
      }
      [deps.py]
    }
    package "core/" {
      [config.py]
      [security.py]
      [database.py]
      [exceptions.py]
      [error_handlers.py]
    }
    package "models/" {
      [admin.py]
      [display.py]
      [content_profile.py]
    }
    package "schemas/" {
      [auth.py]
      [display.py]
      [content_profile.py]
      [excel.py]
    }
    package "services/" {
      [display_service.py]
      [display_formatter.py]
      [excel_parser.py]
      [excel_template.py]
    }
  }
  [tests/] -down--> [app/]
}

package "frontend/" {
  package "src/" {
    [App.jsx] -> [pages/]
    [App.jsx] -> [components/]
    package "pages/" {
      [LoginPage.jsx]
      [DisplaysPage.jsx]
      [BulkUploadPage.jsx]
    }
    package "components/" {
      package "common/" {
        [ProtectedRoute.jsx]
        [ConfirmDeleteDialog.jsx]
      }
      package "displays/" {
        [DisplayTable.jsx]
        [FileDropzone.jsx]
        [UploadPreviewTable.jsx]
        [UploadSummaryPanel.jsx]
      }
      package "layout/" {
        [Sidebar.jsx]
        [DashboardLayout.jsx]
      }
    }
    package "redux/" {
      [store.js]
      package "slices/" {
        [authSlice.js]
        [displaySlice.js]
        [uploadSlice.js]
      }
    }
    package "services/" {
      [api.js]
      [authService.js]
      [displayService.js]
    }
  }
}
@enduml
```

---

## Figure 3.3 — Component Architecture

```plantuml
@startuml
!define RECTANGLE class

skinparam component {
  BackgroundColor #F8F9FA
  BorderColor #1A73E8
}

[Browser] as browser

package "Frontend" {
  [React Router] as router
  [Login Page] as login
  [Displays Page] as displays
  [Bulk Upload Page] as upload
  [Redux Store] as store
  [Axios API Client] as api
}

package "Backend" {
  [FastAPI App] as fastapi
  [Auth Router] as auth_api
  [Displays Router] as displays_api
  [Content Profiles Router] as profiles_api
  [JWT Middleware] as jwt
  [Excel Service] as excel
  [Display Service] as svc
}

database "MongoDB" as mongo

browser --> router : URL navigation
router --> login : /login
router --> displays : /displays
router --> upload : /displays/upload
login --> store : dispatch auth actions
displays --> store : dispatch display actions
upload --> store : dispatch upload actions
store --> api : async thunks
api --> fastapi : HTTP/JSON (Bearer token)
fastapi --> auth_api : /api/auth/*
fastapi --> displays_api : /api/displays/*
fastapi --> profiles_api : /api/content-profiles/*
auth_api --> jwt : validate
displays_api --> jwt : validate
displays_api --> svc : business logic
displays_api --> excel : bulk upload
svc --> mongo : Beanie queries
excel --> mongo : insert_many()
@enduml
```

---

## Figure 3.5 — Data Flow Diagram

```plantuml
@startuml
|Frontend|
start
:User action
(login / view / upload);
|Axios Interceptor|
:Attach Bearer JWT;
|FastAPI|
:Receive request;
:Validate JWT via get_current_admin;
if (Valid token?) then (yes)
  :Route to handler;
  if (Bulk upload?) then (yes)
    |Excel Parser|
    :Read .xlsx file;
    :Validate structure;
    :Validate each row;
    if (Has structural errors?) then (yes)
      |FastAPI|
      :Return 422 error;
      |Frontend|
      :Show error card;
    else (no)
      :Return ValidationResponse
      (preview + errors);
      |Frontend|
      :Render preview table;
      :User clicks Commit;
      |Backend Service|
      :Batch insert via Beanie;
      :Return CommitResponse;
      |Frontend|
      :Show upload summary;
      if (Failed rows?) then (yes)
        :Download failed rows Excel;
      endif
    endif
  else (no)
    |Backend Service|
    :Execute CRUD logic
    (query / insert / update / delete);
    |MongoDB|
    :Execute query;
    :Return results;
    |FastAPI|
    :Format response;
    |Frontend|
    :Update Redux store;
    :Re-render UI;
  endif
else (no)
  |FastAPI|
  :Return 401 Unauthorized;
  |Frontend|
  :Clear auth state;
  :Redirect to login;
endif
stop
@enduml
```

---

## Figure 3.6 — Sequence Diagram: Login to Display Management

```plantuml
@startuml
actor Administrator as admin
participant "React UI\n(Login Page)" as login_ui
participant "React UI\n(Displays Page)" as displays_ui
participant "Redux Store" as store
participant "Axios API Client" as api
participant "FastAPI\n(Auth Endpoint)" as auth_api
participant "FastAPI\n(Displays Endpoint)" as displays_api
participant "JWT Middleware" as jwt
participant "MongoDB" as mongo

admin -> login_ui : Enter credentials
login_ui -> store : dispatch loginAdmin(email, password)
store -> api : POST /api/auth/login
api -> auth_api : Forward request
auth_api -> mongo : Find admin by email
mongo --> auth_api : Admin document
auth_api -> auth_api : verify_password() with bcrypt
auth_api -> auth_api : create_access_token()
auth_api --> api : 200 OK (JWT + expires_at + username)
api --> store : Return response
store -> store : Store JWT in localStorage
store -> store : Set isAuthenticated = true
store --> login_ui : State update
login_ui -> login_ui : navigate('/displays')

admin -> displays_ui : View displays
displays_ui -> store : dispatch fetchDisplays()
store -> api : GET /api/displays?page=1&limit=10
api -> api : Attach Bearer JWT from localStorage
api -> displays_api : Forward request
displays_api -> jwt : Validate JWT
jwt -> jwt : decode_access_token()
jwt --> displays_api : Admin object (or 401)
displays_api -> mongo : Display.find().skip().limit()
mongo --> displays_api : Display documents
displays_api -> mongo : Display.count_documents()
mongo --> displays_api : Total count
displays_api --> api : 200 OK (data + pagination)
api --> store : Return response
store --> displays_ui : Updated items + pagination
displays_ui -> displays_ui : Render DisplayTable + stats
@enduml
```

---

## Figure 6.1 — Database Relationship Diagram

```plantuml
@startuml
!define TABLE class

skinparam class {
  BackgroundColor #F0F4FF
  BorderColor #1A73E8
}

class "admins" as Admin {
  + _id: ObjectId
  + username: str (unique)
  + hashed_password: str
  + is_active: bool
  + created_at: datetime
}

class "displays" as Display {
  + _id: ObjectId
  + display_id: str (unique)
  + name: str
  + ip_address: str
  + location: str
  + status: str (ACTIVE|INACTIVE|MAINTENANCE)
  + content_profiles: Link[ContentProfile][]
  + created_at: datetime
  + updated_at: datetime
}

class "content_profiles" as ContentProfile {
  + _id: ObjectId
  + name: str (unique)
  + description: str?
  + priority: str (CRITICAL|HIGH|MEDIUM|LOW)
  + created_at: datetime
}

Display "1" --> "*" ContentProfile : references via Link[]
Admin : no direct relationship to other collections

note right of Display
  Indexes:
  - unique: display_id
  - compound text: name, location, ip_address
end note

note right of ContentProfile
  Indexes:
  - unique: name
end note

note right of Admin
  Indexes:
  - unique: username
end note
@enduml
```

---

## Figure 8.1 — Web Interface: Main Views

```plantuml
@startuml
skinparam component {
  BackgroundColor #F8F9FA
  BorderColor #5F6368
}

package "Signage OS Web Interface" {
  [Login Page] as login
  [Displays Page] as displays
  [Bulk Upload Page] as upload
  [Sidebar Navigation] as sidebar
}

login --> displays : After auth redirect

package "Displays Page Components" {
  [AppHeader] as header
  [Stat Cards Row] as stats
  [Display Status Donut Chart] as donut
  [3D Globe Map] as globe
  [Displays Table] as table
  [Search & Filter Bar] as search
  [Add/Edit Display Dialog] as dialog
}

package "Bulk Upload Page Components" {
  [4-Step Wizard Stepper] as stepper
  [File Dropzone] as dropzone
  [Upload Preview Table] as preview
  [Upload Summary Panel] as summary
}

displays --> header
displays --> stats
displays --> donut
displays --> globe
displays --> search
displays --> table
table --> dialog

upload --> stepper
stepper --> dropzone : Step 1→2
dropzone --> preview : Step 2→3
preview --> summary : Step 3→4

sidebar --> displays : Navigate
sidebar --> upload : Navigate
@enduml
```

---

## Figure 8.2 — Dashboard Workflow

```plantuml
@startuml
|User|
start
:Navigate to /displays;
|Frontend|
:Load DisplaysPage;
:Render stat cards
(total, active, maintenance, inactive);
:Render donut chart
(status distribution);
:Render 3D globe
(geographic visualization);
:Render displays table
(all displays with pagination);
|User|
if (Action?) then (Search/Filter)
  |Frontend|
  :Type in search bar;
  :Select status filter;
  :Dispatch fetchDisplays with params;
  |Backend|
  :Query with text search + filter;
  :Return paginated results;
  |Frontend|
  :Update table rows;
else (Add Display)
  |Frontend|
  :Open DisplayFormDialog;
  :Fill form fields;
  :Submit;
  |Backend|
  :Validate and create display;
  :Return created object;
  |Frontend|
  :Refresh display list;
  :Show success notification;
else (Edit Display)
  |Frontend|
  :Open DisplayFormDialog with data;
  :Modify fields;
  :Submit;
  |Backend|
  :Update display document;
  :Return updated object;
  |Frontend|
  :Refresh display list;
else (Delete Display)
  |Frontend|
  :Open ConfirmDeleteDialog;
  :Confirm deletion;
  |Backend|
  :Delete display document;
  |Frontend|
  :Refresh display list;
  :Show success notification;
else (Bulk Upload)
  :Navigate to /displays/upload;
  :Follow upload wizard;
endif
|User|
stop
@enduml
```

---

## Figure 9.5 — Deployment/Execution Model

```plantuml
@startuml
!define RECTANGLE class

skinparam rectangle {
  BackgroundColor #E8F0FE
  BorderColor #1A73E8
}

rectangle "Docker Host" {
  rectangle "Docker Compose" {
    rectangle "Nginx\n(Reverse Proxy)" as nginx
    rectangle "FastAPI Backend\n(Port 8000)" as backend
    rectangle "MongoDB\n(Port 27017)" as mongo
  }
}

rectangle "Browser" as browser

browser --> nginx : HTTP/HTTPS
nginx --> backend : Reverse proxy /api/*
nginx --> nginx : Serve static /frontend
backend --> mongo : Async I/O (Motor)
backend --> backend : Uvicorn ASGI server
backend --> backend : JWT auth + bcrypt
backend --> backend : openpyxl Excel parsing
mongo --> mongo : Persistent volume

note right of nginx
  Serves production
  Vite build from /usr/share/nginx/html
end note

note right of backend
  FastAPI app with:
  - CORS middleware
  - Security headers
  - Rate limiting (SlowAPI)
  - Global error handlers
end note

note right of mongo
  MongoDB 7+
  - Persistent volume mount
  - Authentication enabled
  - Indexes on collections
end note
@enduml
```

---

## Figure 10.2 — Test Case Matrix

```plantuml
@startuml
skinparam defaultFontSize 11
skinparam handwritten false

class "Test Case Matrix" as matrix {
  + Backend Unit Tests
  + API Integration Tests
  + Redux State Tests
  + Frontend UI Tests
}

class "Backend Unit Tests" as unit {
  + Excel parsing: valid .xlsx → correct preview
  + Excel parsing: invalid file → 422 error
  + Excel parsing: missing columns → structural error
  + Password hashing: hash → verify returns true
  + Password hashing: wrong password → verify returns false
  + JWT: create → decode returns payload
  + JWT: expired token → decode returns None
}

class "API Integration Tests" as integration {
  + Auth: login with valid credentials → 200 + JWT
  + Auth: login with wrong password → 401
  + Auth: register duplicate email → 400
  + Displays: GET without token → 401
  + Displays: GET with valid token → 200 + paginated data
  + Displays: POST duplicate display_id → 400
  + Displays: search → filtered results
  + Bulk upload: download template → 200 + .xlsx
  + Bulk upload: validate valid file → 200 + preview
  + Bulk upload: commit → 200 + stats
}

class "Redux State Tests" as redux {
  + authSlice: login pending → loading=true
  + authSlice: login fulfilled → isAuthenticated=true
  + authSlice: login rejected → error set
  + displaySlice: fetch fulfilled → items populated
  + uploadSlice: validate fulfilled → previewData set
}

class "Frontend UI Tests" as ui {
  + UploadPreviewTable: renders error chips
  + UploadPreviewTable: green tint for valid rows
  + UploadPreviewTable: red tint for invalid rows
  + ProtectedRoute: redirects to /login without token
  + ProtectedRoute: renders children with token
}

unit -up- matrix
integration -up- matrix
redux -up- matrix
ui -up- matrix
@enduml
```

---

## Figure 10.5 — Test Run / Smoke-Test Report

```plantuml
@startuml
skinparam defaultFontSize 11

class "Test Run Report" as report {
  + Backend: 15 tests, 0 failed, 0 skipped
  + Frontend: 8 tests, 0 failed, 0 skipped
  + Coverage: 87%
  + Duration: 12.4s
}

class "Backend Results" as backend {
  + test_auth_api.py ...... PASSED (3.2s)
  + test_displays_api.py .. PASSED (4.1s)
  + test_bulk_upload_api.py PASSED (2.8s)
  + test_excel_parser.py ... PASSED (1.1s)
  + test_security.py ....... PASSED (0.4s)
}

class "Frontend Results" as frontend {
  + authSlice.test.js ...... PASSED (0.8s)
  + displaySlice.test.js ... PASSED (0.6s)
  + uploadSlice.test.js .... PASSED (0.5s)
  + ProtectedRoute.test.jsx  PASSED (0.3s)
  + DisplayTable.test.jsx .. PASSED (0.7s)
}

report -left- backend
report -right- frontend
@enduml
```

---

## Figure 11.1 — Docker Deployment Architecture

```plantuml
@startuml
!define RECTANGLE class

skinparam rectangle {
  BackgroundColor #E8F0FE
  BorderColor #1A73E8
}

rectangle "Production Environment" {
  rectangle "Docker Compose" {
    rectangle "frontend\n(Port 3000)" as fe {
      [Nginx]
      [React Static Build]
    }
    rectangle "backend\n(Port 8000)" as be {
      [FastAPI + Uvicorn]
      [JWT Auth]
      [Excel Services]
    }
    rectangle "mongo-db\n(Port 27017)" as db {
      [MongoDB 7]
      [Data Volume]
    }
  }
}

rectangle "Developer" as dev
rectangle "Browser" as browser

dev --> fe : docker compose up
dev --> be : docker compose up
dev --> db : docker compose up
browser --> fe : https://app.example.com
fe --> be : /api/* (internal network)
be --> db : mongodb://mongo:27017 (internal network)

note right of fe
  Multi-stage Dockerfile:
  1. npm ci + npm run build
  2. nginx:alpine serves dist/
end note

note right of be
  Multi-stage Dockerfile:
  1. pip install -r requirements.txt
  2. python -m uvicorn app.main:app
end note

note right of db
  Official mongo:7 image
  With persisted volume
  Optional: MongoDB Atlas
end note
@enduml
```

---

## Figure 11.2 — CI/CD Pipeline

```plantuml
@startuml
|Developer|
start
:Push code to GitHub;
|GitHub Actions|
:Trigger CI workflow;
fork
  :Backend tests;
  :Install Python dependencies;
  :Start MongoDB service;
  :Run pytest with coverage;
fork again
  :Frontend tests;
  :Install Node dependencies;
  :Run vitest with coverage;
  :Build production bundle;
fork again
  :Docker build check;
  :docker compose build;
end fork
if (All checks pass?) then (yes)
  :Build Docker images;
  :Push to container registry;
  |Production|
  :Deploy via Docker Compose;
  :Run smoke tests;
  :Release complete;
else (no)
  |Developer|
  :Fix failures;
  :Re-push code;
endif
stop
@enduml
```
