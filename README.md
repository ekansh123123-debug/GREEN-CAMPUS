# GREEN CAMPUS

**Campus Issue Reporting, Student Resource Exchange, and Sustainability Analysis Platform**  
*D. Y. Patil College of Engineering, Akurdi, Pune*  
*Department of Artificial Intelligence & Data Science*

---

## Overview

**GREEN CAMPUS** is a role-based, mobile-first web platform engineered to streamline campus facility maintenance, promote circular economy practices through peer-to-peer student resource exchange, and provide real-time, transparent sustainability and cleanliness analytics across the campus.

The platform is modeled around the **5 Academic Blocks (`Block A` through `Block E`)** of D. Y. Patil College of Engineering (DYPCOE), Akurdi, enabling granular tracking of classrooms, specialized departmental laboratories, cafeterias, and common areas.

---

## Key Modules

### 1. Campus Issue Reporting & Facility Tracking
- **Campus Academic Blocks:** Structured across all 5 campus sectors:
  - **Block A:** Main Academic Building (*Civil Engineering, Administration, Dean Chambers*)
  - **Block B:** Applied Sciences & Basic Engineering (*Applied Physics Lab, Applied Chemistry Lab, First-Year Classrooms*)
  - **Block C:** Computer Engineering & IT Complex (*AI & Machine Learning Lab, Data Science Lab, IoT Center*)
  - **Block D:** Mechanical & Robotics Engineering (*CAD/CAM Lab, Thermodynamics Lab, Central Workshop Bay 3*)
  - **Block E:** Campus Cafeteria, Canteen & Central Library (*Main Dining Hall, Commercial Kitchen, Quiet Reading Rooms*)
- **Deterministic Similar-Issue Matching:** Rule-based matching on `category_id`, `building_name`, and `floor_no` to detect duplicates and prevent ticket fatigue.
- **Student Upvoting:** Students upvote open complaints to surface high-impact maintenance hotspots (enforces 1-upvote-per-student limit; self-upvoting is prevented).
- **Admin Triage & Work Orders:** Priority levels (*Low, Medium, High, Critical*), maintenance technician assignment, and an immutable status audit trail (*Submitted → Assigned → In Progress → Resolved*).

### 2. Student Resource Exchange Marketplace
- **Academic Goods Reusability:** Facilitates circular reuse of textbooks, reference books, lecture notes, scientific calculators, mini-drafters, drawing kits, and lab tools.
- **Three Exchange Modes:**
  - **Donate:** Free academic handover to peers.
  - **Sell:** Direct peer-to-peer transaction at student-friendly INR pricing.
  - **Exchange:** Barter exchange for requested academic supplies.
- **Dual-Confirmation Transaction Gate:** Reused item counters increment **only** after both the listing owner and requester physically meet and confirm the handover (`owner_confirmed AND requester_confirmed`).

### 3. Sustainability & Facility Cleanliness Dashboard
- **Public Campus Transparency:** Cleanliness metrics and operational statistics are accessible to all campus members (Students & Staff) with active persona indicators.
- **Room-by-Room Cleanliness Directory:**
  - Granular room-level monitoring across all 5 blocks with specific room identifiers (e.g., `A-101`, `B-101`, `C-301`, `D-Bay 3`, `E-Cafeteria-01`).
  - Dedicated facility filters for **`🔬 Labs Only`** and **`🍽️ Cafeteria & Dining`**.
  - **Incident Summaries:** Categorized breakdown of logged maintenance faults.
  - **Handling Records:** Assigned technicians, specific repair actions taken, resolution turnaround hours, and operational status (*Clean & Operational* vs *In Progress*).
- **Longitudinal Trends & Hotspots:** Recharts visualizations tracking monthly submission vs. resolution volume, category distribution, and recurring maintenance hotspots.
- **Maintenance Directory:** Staff duty rosters, response metrics, and acknowledged student campus guardians.

### 4. Mobile-First Optimization & Accessibility
- **Mobile Bottom Navigation (`MobileBottomNav`):** Persistent bottom navigation bar with role-specific tabs and elevated quick-action buttons.
- **Touch Ergonomics:** Meets WCAG 2.1 AA accessibility standards with minimum 44×44px interactive tap targets across mobile buttons, inputs, and filters.
- **Responsive Views:** Adaptive 2×2 metric cards, responsive data tables, and touch-friendly drawers optimized for compact smartphone viewports.

---

## Technical Stack & Architecture

Frontend and backend remain strictly decoupled, communicating exclusively via HTTP JSON REST APIs:

```text
GREEN-CAMPUS/
├── backend/                  # Python 3.11+, FastAPI, SQLAlchemy 2.0, PostgreSQL / SQLite
│   ├── app/
│   │   ├── config/           # Database engine & environment settings
│   │   ├── controllers/      # Deterministic business logic & SQL calculations
│   │   ├── middleware/       # Magic-byte upload validation & JWT RBAC guards
│   │   ├── models/           # 12 Normalized PostgreSQL (3NF) relational tables
│   │   ├── routes/           # FastAPI REST endpoint routers
│   │   ├── schemas/          # Pydantic v2 request & response serializers
│   │   └── services/         # ImageKit cloud storage integration with local fallback
│   ├── sql/                  # DDL migrations (schema.sql) & seed scripts (seed.sql)
│   └── tests/                # Automated pytest test suite (14 passing tests)
├── frontend/                 # React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
│   ├── src/
│   │   ├── components/       # Reusable UI & Layout components (Navbar, MobileBottomNav, etc.)
│   │   ├── context/          # Auth context & evaluator persona state
│   │   ├── data/             # Mock datasets for offline development & campus benchmarks
│   │   ├── features/         # Modular feature views (Issues, Marketplace, Staff, Analytics, Admin)
│   │   ├── lib/              # API client & campus metadata constants
│   │   └── test/             # Vitest & Testing Library test suites (26 passing tests)
├── .agents/                  # Local project specifications & design contracts (Git ignored)
├── README.md                 # Project documentation
└── .gitignore                # Global exclusion rules
```

---

## Role-Based Access Control (RBAC)

| Role / Persona | Responsibilities & Capabilities |
| :--- | :--- |
| **Student** | Reports facility issues, upvotes open peer reports, creates & requests marketplace listings, confirms physical item handovers, and tracks live campus cleanliness stats. |
| **Maintenance Staff** | Views assigned maintenance work orders, updates status (*In Progress*, *Resolved*), and logs resolution remarks and turnaround times. |
| **Administrator** | Verifies institutional student accounts, assigns official priorities and staff during triage, moderates marketplace listings, and inspects operational analytics. |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher
- **PostgreSQL** (Optional for local development; SQLite fallback supported out of the box)

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (optional for local SQLite development):
   ```bash
   cp .env.example .env
   ```

5. Run test suite:
   ```bash
   pytest tests
   ```

6. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API interactive docs will be available at: `http://localhost:8000/docs`

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run automated test suite:
   ```bash
   npm test
   ```

4. Run linter:
   ```bash
   npm run lint
   ```

5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Application will be accessible at: `http://localhost:5173`

6. Build for production:
   ```bash
   npm run build
   ```

---

## Cloud Deployment

- **Database:** Deployable on [Supabase](https://supabase.com) (PostgreSQL 16+) by executing `backend/sql/schema.sql` and `backend/sql/seed.sql`.
- **Backend Service:** Deployable on [Render](https://render.com) Web Services with build command `pip install -r requirements.txt` and start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Frontend SPA:** Deployable on [Vercel](https://vercel.com) or Cloudflare Pages with build command `npm run build` and output directory `dist/`.

---

## Testing & Quality Assurance

| Test Suite | Framework | Scope | Status |
| :--- | :--- | :--- | :--- |
| **Backend API Security & Flows** | `pytest` + `httpx` | Auth, duplicate SQL detection, 1-upvote gate, dual-confirmation transaction, upload validation | **14 / 14 Passed** |
| **Frontend Workflows & Components** | `vitest` + React Testing Library | Full user journeys (student, staff, admin), modals, responsive bottom nav, accessibility | **26 / 26 Passed** |
| **Static Code Quality** | `oxlint` | Code style, React rules, unused variables | **0 Errors, 0 Warnings** |
