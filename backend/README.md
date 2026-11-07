# Green Campus V1 — FastAPI Backend Service

Backend service for **Green Campus**: Campus Issue Reporting, Resource Exchange, and Sustainability Analysis Platform at **D. Y. Patil College of Engineering, Akurdi, Pune** (Department of Artificial Intelligence and Data Science).

Built with **Python 3.11+**, **FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL 16+**, and **ImageKit** cloud object storage.

---

## 1. Architecture Overview (MVC-Inspired)

The backend follows a decoupled, beginner-friendly MVC-inspired architecture:

```text
backend/
├── app/
│   ├── main.py                   # FastAPI entry point, CORS, and router registration
│   ├── config/
│   │   ├── settings.py           # Environment variables (DB, JWT, ImageKit)
│   │   └── database.py           # SQLAlchemy engine & session maker
│   ├── models/                   # [M] 12 PostgreSQL 3NF Table Definitions
│   │   ├── base.py               # Declarative Base
│   │   ├── user_model.py         # roles, departments, users
│   │   ├── issue_model.py        # campus_locations, issue_categories, issues, upvotes, status_history
│   │   └── marketplace_model.py  # marketplace_categories, listings, requests, transactions
│   ├── schemas/                  # [V] Pydantic Request & Response DTOs
│   │   ├── auth_schema.py        # Registration, Login, Token, Profile views
│   │   ├── issue_schema.py       # Issue report, duplicate query, status update views
│   │   ├── marketplace_schema.py # Listing, request, dual-confirmation views
│   │   └── analytics_schema.py   # Overview KPI, hotspot, and trend chart views
│   ├── services/                 # External Cloud Integrations
│   │   └── imagekit_service.py   # ImageKit SDK client with offline/mock fallback
│   ├── middleware/               # Security & Validation Guards
│   │   ├── auth_middleware.py    # JWT validation & require_role() RBAC guard
│   │   └── upload_validator.py   # MIME check, magic bytes verification, 5MB limit
│   ├── controllers/              # [C] Deterministic Business Logic (No AI/ML)
│   │   ├── auth_controller.py    # Institutional email verification, bcrypt hashing, JWT issuance
│   │   ├── issue_controller.py   # Rule-based similar query, 1x upvote, audit logging, admin priority
│   │   ├── marketplace_controller.py # Atomic request acceptance, dual-confirmation transaction gate
│   │   └── analytics_controller.py   # SQL aggregations, resolution rate formula, avg time math
│   └── routes/                   # Thin REST API Endpoint Routers
│       ├── auth_routes.py        # /auth/register, /auth/login, /users/me
│       ├── issue_routes.py       # /issues, /issues/similar, /issues/{id}/status, /issues/{id}/upvote
│       ├── marketplace_routes.py # /listings, /requests/{id}, /transactions/{id}/confirm
│       ├── analytics_routes.py   # /analytics/overview, /issues, /marketplace, /trends
│       └── upload_routes.py      # /upload/image (ImageKit endpoint)
├── sql/
│   ├── schema.sql                # Pure 12-table 3NF PostgreSQL DDL & B-tree indexes
│   └── seed.sql                  # Canonical roles, 8 issue categories, 8 marketplace categories
├── tests/
│   ├── conftest.py               # Pytest fixtures, test database, authenticated role headers
│   └── test_api.py               # Deterministic test suite TC-01 through TC-14
├── .env.example                  # Environment configuration template
├── requirements.txt              # Locked Python dependencies
└── README.md                     # Backend documentation
```

---

## 2. ImageKit Cloud Object Storage

Green Campus uses **ImageKit** to host images uploaded for issue reports and marketplace items.

### Configuration
In `backend/.env`:
```env
IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
IMAGEKIT_PRIVATE_KEY="your_imagekit_private_key"
IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_imagekit_id"
IMAGEKIT_FOLDER_ISSUES="/green-campus/issues"
IMAGEKIT_FOLDER_MARKETPLACE="/green-campus/marketplace"
```

### Upload Flow & Validation Safeguards (`TC-05`)
- Endpoint: `POST /upload/image` (accepts multipart/form-data with `file` and optional `category='issues'|'marketplace'`).
- Validates file size `<= 5 MB` (`5242880` bytes).
- Inspects magic bytes (JPEG: `\xFF\xD8\xFF`, PNG: `\x89PNG\r\n\x1a\n`, WebP: `RIFF....WEBP`).
- Rejects executable extensions (`.exe`, `.sh`, `.php`, `.js`, `.py`, `.svg`, `.html`) with `HTTP 422 Unprocessable Entity`.
- Discards client-supplied filenames and replaces them with clean UUID filenames.
- **Offline / Mock Fallback**: If ImageKit credentials are not supplied (e.g., in unit testing or offline local dev), the service automatically generates valid mock ImageKit CDN URLs without network failures.

---

## 3. Relational Database Schema (12 Tables in 3NF)

1. `roles`: Canonical roles (`Student`, `Administrator`, `Maintenance_Staff`).
2. `departments`: Academic, Maintenance, and Administrative departments.
3. `users`: Institutional accounts (`@dypcoeakurdi.ac.in`) with bcrypt password hashes.
4. `campus_locations`: Standardized location hierarchy (`building_name`, `floor_no`, `room_code`, `room_or_area_type`).
5. `issue_categories`: 8 locked categories (`Water`, `Electricity`, `Waste Management`, `Cleanliness`, `Sanitation`, `Infrastructure`, `Laboratory Equipment`, `Other`).
6. `issues`: Campus complaints with status progression (`Submitted -> Assigned -> In Progress -> Resolved`), administrative priority, and upvote counters.
7. `issue_upvotes`: 1 upvote per student, reporters blocked from self-upvote (`UNIQUE (issue_id, user_id)`).
8. `issue_status_history`: Immutable audit trail for every status transition.
9. `marketplace_categories`: 8 academic exchange categories (`Textbooks`, `Notes`, `Calculators`, etc.).
10. `marketplace_listings`: Peer items for `Donate` (₹0), `Sell` (INR price), or `Exchange`.
11. `exchange_requests`: Student requests for available listings (`UNIQUE (listing_id, requester_id)`).
12. `exchange_transactions`: Dual-confirmation gate (`owner_confirmed` AND `requester_confirmed`).

---

## 4. REST API Endpoints (20 Endpoints)

| HTTP Method | Path | Allowed Roles | Description |
|:---|:---|:---|:---|
| `POST` | `/auth/register` | Public | Register with `@dypcoeakurdi.ac.in` email and Student/Staff ID (`TC-09`) |
| `POST` | `/auth/login` | Public | Authenticate credentials and return signed JWT with role claim |
| `GET` | `/users/me` | Authenticated | Fetch current authenticated user profile (`TC-14`) |
| `GET` | `/issues/similar` | Student, Admin | Deterministic SQL duplicate search by category + building + floor (`TC-02`) |
| `POST` | `/issues` | Student, Admin | Submit a new issue report |
| `GET` | `/issues` | Authenticated | List issues with filters (Maintenance Staff view assigned queue) |
| `GET` | `/issues/{id}` | Authenticated | Retrieve full issue details and audit trail timeline (`TC-11`) |
| `PATCH` | `/issues/{id}/status` | Admin, Staff | Admin sets priority & assignee (`TC-01`, `TC-10`); Staff updates status |
| `POST` | `/issues/{id}/upvote` | Student | Add 1 upvote (`TC-03`, `TC-04`) |
| `DELETE` | `/issues/{id}/upvote` | Student | Remove existing upvote |
| `POST` | `/issues/{id}/feedback` | Student | Post-resolution feedback by reporter |
| `POST` | `/listings` | Student | Create marketplace listing |
| `GET` | `/listings` | Authenticated | Browse available marketplace items |
| `GET` | `/listings/{id}` | Authenticated | Retrieve single listing and request history |
| `POST` | `/listings/{id}/requests`| Student | Submit request for an available item |
| `PATCH` | `/requests/{id}` | Student (Owner) | Accept or reject request; cancel reverts listing to Available (`TC-12`) |
| `POST` | `/transactions/{id}/confirm` | Student (Owner/Req) | Dual-confirmation protocol (`TC-06`, `TC-07`) |
| `GET` | `/analytics/overview` | Administrator | Top-level KPI summary cards (`TC-08`, `TC-13`) |
| `GET` | `/analytics/issues` | Administrator | Category breakdown and building/floor maintenance hotspots |
| `GET` | `/analytics/marketplace` | Administrator | Resource reuse counts and exchange modes |
| `GET` | `/analytics/trends` | Administrator | Monthly resolution and reuse trend charts |
| `POST` | `/upload/image` | Authenticated | Upload photo to ImageKit cloud storage (`TC-05`) |
| `GET` | `/health` | Public | Health status check |

---

## 5. Local Setup & Running Tests

### 1. Create and Activate Virtual Environment
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and ImageKit keys if available
```

### 4. Run Automated Test Suite (`TC-01` through `TC-14`)
```bash
pytest tests/test_api.py -v
```

### 5. Start Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- Alternative ReDoc UI: `http://127.0.0.1:8000/redoc`
- Health check: `http://127.0.0.1:8000/health`

