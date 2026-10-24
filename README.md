# SOILEX Life Science — Enterprise ERP System

> Full-stack ERP platform for international spice & agro commodity export operations.

![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)
![DuckDB](https://img.shields.io/badge/Database-DuckDB-FFC107)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwindcss)

---

## Overview

SOILEX Life Science ERP is a comprehensive, multi-facility international export enterprise resource planning system covering **16 operational modules** — from sourcing, procurement, and commercial trade logistics to general ledger accounting, talent recruitment, workforce appraisals, and executive intelligence. Built with a high-performance **React + Tailwind CSS** frontend and a modular **FastAPI + DuckDB** backend powered by the Repository Pattern for on-prem or PostgreSQL migration.

### Brand Identity
- **Company**: SOILEX Life Science (BR-HN)
- **Tagline**: The Essence of Authentic Spices
- **Colors**: White, Royal Blue (`#1E40AF`), Dark Yellow (`#D97706`)
- **Website**: [soilexlifescience.com](https://soilexlifescience.com)
- **Repository**: [github.com/aniket1240as-arch/VI](https://github.com/aniket1240as-arch/VI)

---

## Enterprise Feature Modules

| Module | Features & Capabilities |
|--------|-------------------------|
| 📊 **Executive Overview** | C-suite KPI widgets, gross trade volume, active shipments, container tracking |
| 🌶️ **Commodity Catalog** | Whole Spices, Agro Grains, Animal Feed SKU catalog with grades & origins |
| 🛒 **Procurement & PO** | Purchase Orders lifecycle (`DRAFT → APPROVED → SENT → RECEIVED`), Goods Receipt Notes (GRN), quality inspection, tolerance matching |
| 💵 **Finance & Accounting** | Commercial Sales Orders, General Ledger with Chart of Accounts, Sales Invoices, AR Aging, Payment entries & UTR settlement |
| 🚢 **Global Trade & Logistics** | Export/Import trade contracts, Bills of Lading, reefer/dry container manifests |
| 🤝 **Partners Network** | Verified international buyers, certified farming suppliers, trade brokers |
| 👥 **Employee Directory** | Complete personnel directory with biometric codes, emergency contacts & food safety certs |
| 📋 **HR & Workforce Dashboard** | Live workforce attendance gauge, pending approvals, shift rosters |
| ⏰ **Attendance & Leaves** | Biometric clock-in simulator, overtime calculation, attendance regularization |
| 💰 **Payroll Management** | Automated salary calculation, tax withholding, statutory deductions, pay slips |
| 🎯 **Recruitment & Hiring** | Job postings, candidate ATS pipeline, multi-stage interview scheduling |
| 📈 **Performance & Appraisals** | Quarterly OKRs, employee goals, 9-box performance-potential matrix, 360 reviews |
| 📱 **Employee Portal (ESS)** | Self-service punch log, weekly timesheet tracker, leave applications |
| 📅 **Scientific Calendar** | Real-time operational scheduling with live ticking clock |
| ✅ **Task Planner** | Categorized TODO board with priority matrix |
| 📑 **BI & Export Reports** | Foreign trade revenue analytics, audit trail logs, compliance reports |

### Identity & Access Management (IAM)
- JWT token persistence with PBKDF2-SHA256 password hashing
- Role-based access control: `ADMIN`, `TRADE_OFFICER`, `QUALITY_MANAGER`, `HR_MANAGER`, `EMPLOYEE`
- Automatic role routing & least-privilege self-service access restrictions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 5, Tailwind CSS, Lucide Icons |
| **Backend** | FastAPI, Pydantic v2, Uvicorn |
| **Database** | DuckDB (embedded, ACID compliant, thread-safe — zero external DB setup required) |
| **Auth** | JWT (python-jose), PBKDF2-HMAC-SHA256 |
| **Architecture** | Repository Pattern with abstract `BaseRepository` interface |

---

## Quick Start

### Prerequisites
- **Node.js** 18+ (with npm)
- **Python** 3.12+

### 1. Install Frontend Dependencies
```bash
cd VI
npm install
```

### 2. Install Backend Dependencies
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Start Both Servers
```bash
# Terminal 1: Backend (auto-creates & seeds database)
cd backend
python run.py
# → http://127.0.0.1:8000
# → Swagger API Docs: http://127.0.0.1:8000/docs

# Terminal 2: Frontend
cd VI
npm run dev
# → http://localhost:3000
```

### 4. Demo Login Credentials
| Email | Password | Role |
|-------|----------|------|
| `admin@soilexlifescience.com` | `admin123` | Executive Admin |
| `hoan.vu@soilexlifescience.com` | `trade123` | Trade Officer |
| `rajesh.s@soilexlifescience.com` | `qa123` | QA Lab Director |
| `priya.n@soilexlifescience.com` | `hr123` | HR Manager |

---

## API Architecture

All endpoints are organized under `/api/v1` with automated OpenAPI schemas at `/docs`.

| Domain Router | Base Prefix | Key Operations |
|---------------|-------------|----------------|
| **Auth** | `/auth` | `/login`, `/me` |
| **Dashboard** | `/dashboard` | `/executive-summary` |
| **Procurement** | `/procurement` | `/purchase-orders`, `/grns`, `/summary` |
| **Finance** | `/finance` | `/sales-orders`, `/chart-of-accounts`, `/journal-entries`, `/invoices`, `/payments`, `/summary` |
| **Products** | `/products` | Products CRUD, categories, stock tracking |
| **Trade** | `/trade` | Contracts, shipments, container temperature & status |
| **Partners** | `/partners` | Buyers, suppliers, brokers directory |
| **Employees** | `/employees` | Employee profiles, exits & clearances |
| **Attendance** | `/attendance` | Clock-in, leaves, regularizations, timesheets |
| **Payroll** | `/payroll` | Records, generation, pay slips |
| **Recruitment** | `/recruitment` | Job openings, candidates, interview schedules |
| **Performance** | `/performance` | Goals, OKRs, appraisal cycles, reviews |
| **Calendar** | `/calendar` | Operations events & schedules |
| **Tasks** | `/tasks` | Workspace tasks & priorities |
| **Reports** | `/reports` | Export revenue analytics, audit trail |
| **Admin** | `/admin` | Facilities, system diagnostic info |
| **Health** | `/health` | Live backend healthcheck |

---

## Database Engine & Migration

DuckDB is utilized for zero-configuration embedded local storage. Queries are serialized via `DuckDBManager` with thread-safe connection pooling.

To migrate to PostgreSQL on bare-metal or cloud:
1. Update `DATABASE_TYPE=postgres` in `.env`.
2. Provide standard `DATABASE_URL=postgresql://user:password@host:5432/soilex_erp`.
3. The repository factory pattern in `app/repositories/__init__.py` will swap connection drivers without altering API contracts or endpoint code.
