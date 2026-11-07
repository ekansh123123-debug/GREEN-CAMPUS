# GREEN CAMPUS

**Campus Issue Reporting, Student Resource Exchange, and Sustainability Analysis Platform**  
*D. Y. Patil College of Engineering, Akurdi, Pune*

---

## Overview

GREEN CAMPUS is a role-based, responsive web application engineered to streamline campus facility maintenance reporting, encourage circular student resource sharing (textbooks, drawing instruments, calculators, lab essentials), and provide administrators with verified, operational sustainability metrics.

## Key Modules

1. **Campus Issue Reporting and Tracking:**
   - Manual category selection (Water, Electricity, Waste Management, Cleanliness, Sanitation, Infrastructure, Laboratory Equipment, Other).
   - Deterministic similar-issue matching by category, building, and floor to reduce duplicate complaints.
   - Affectee upvoting (one vote per student, no self-upvotes).
   - Administrative priority assignment (Low, Medium, High, Critical) and maintenance staff task queues with immutable audit history.

2. **Student Resource Exchange Marketplace:**
   - Academic item listings (Textbooks, Reference Books, Notes, Calculators, Drawing Instruments, Lab Equipment, Electronics, Stationery).
   - Three transaction modes: **Donate** (free), **Sell** (direct peer-to-peer INR price), and **Exchange** (academic item barter).
   - Dual-confirmation physical handover: both owner and requester must confirm handover before status marks as exchanged and counts towards reuse metrics.

3. **Sustainability Analysis Dashboard:**
   - Real operational metrics computed from verified records: valid issue resolution rate, average resolution time (hours), category/building breakdown, and verified item reuse counts.
   - Clean data visualizations with accessible chart legends and tables.

---

## Project Structure

Following the project's non-negotiable boundaries, the repository is strictly partitioned into:

```text
GREEN-CAMPUS/
├── backend/          # Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL (Standalone)
├── frontend/         # React, Vite, Tailwind CSS, Recharts (Standalone)
├── .agents/          # Local project specifications & design contracts (Git ignored)
├── README.md         # This repository overview
└── .gitignore        # Global exclusion rules
```

---

## Getting Started

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Run test suite:
```bash
npm run test
```

Build for production:
```bash
npm run build
```

---

## Roles & Permissions

- **Student:** Report issues, view open similar issues, upvote issues, list/request marketplace items, confirm receipt.
- **Maintenance Staff:** View only assigned tasks, update work to *In Progress* / *Resolved*, and record completion remarks.
- **Administrator:** Supervise users, assign official priorities and staff, triage issues, moderate marketplace, and view complete operational sustainability analytics.
