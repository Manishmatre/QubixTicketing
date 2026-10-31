# QUBIX — Enterprise Multi-Tenant Project & Issue Ticketing SaaS Platform

> **"One Workspace. Every Issue. Complete Control."**

QUBIX is a production-grade, multi-tenant Software-as-a-Service (SaaS) application designed for high-velocity software companies, IT service providers, agencies, and enterprise teams to manage projects, track issues, assign ownership, collaborate in real time, and resolve tickets with complete visibility.

---

## 🌟 Key Product Capabilities

### 1. Multi-Tenant Architecture & Data Isolation
- **Tenant Context**: Every organization operates inside a dedicated, isolated workspace with a unique slug URL (`qubix.io/:slug`).
- **Middleware Security**: Every database query is strictly scoped to `organizationId`. Cross-tenant data leakage is mathematically prevented at the API and database levels.
- **8-Tier Role-Based Access Control (RBAC)**:
  1. **Platform Super Admin** (`admin@qubix.io`)
  2. **Organization Owner**
  3. **Organization Admin**
  4. **Project Manager**
  5. **Team Lead**
  6. **Employee / Developer**
  7. **Reporter / Client**
  8. **Read-only Viewer**

### 2. High-Conversion SaaS Marketing Website
- Premium landing page with hero presentation, live interactive preview, feature breakdown, customer use cases, FAQ accordion, and transparent monthly/yearly pricing.
- 8-Step Interactive Onboarding Wizard (`/onboarding`) with progress tracking.

### 3. Real-Time Kanban Board & Workspaces
- Reproduces the visual identity of modern enterprise ticketing systems (clean white cards, light grey background `#F8FAFC`, dark navy typography `#111827`, blue accent `#2563EB`).
- **Columns**: To Do, In Progress, Resolved.
- **Drag & Drop**: Instant optimistic UI updates with automatic rollback on error.
- **Live Sync**: Socket.IO broadcasts updates to all active team browsers in real time.

### 4. Ticket Details Drawer (Slide-out Right Drawer)
- Click any ticket from any view to slide out the right-side inspector.
- **Header**: Ticket number (e.g. `QUB-000101`), title, project, status, priority, and assignee.
- **Tabs**:
  - **Public Comments**: Real-time comment stream, timestamps, user avatars.
  - **Internal Notes**: Restricted exclusively to internal team members (strictly hidden from external reporters/clients).
  - **Attachments**: Drag-and-drop file uploads with secure MIME validation and downloads.
  - **Activity Timeline**: Full chronological audit trail of all changes.

### 5. Automated Workflow Engine
- Configure conditional rules:
  - **Triggers**: Priority becomes Urgent/Critical, Ticket Created, Ticket Resolved, etc.
  - **Actions**: Auto-assign to lead, dispatch in-app notifications, send email alerts, apply tags (`#escalated`).

### 6. Reports & Executive Analytics
- Velocity trends area chart, SLA compliance indicators, workload distribution, category breakdowns, and one-click export to **CSV** and **PDF**.

### 7. SaaS Billing & Subscription Management
- Configurable tiers: **Starter** ($19/mo), **Professional** ($49/mo), **Business** ($129/mo), **Enterprise** ($399/mo).
- Invoice history, seat usage progress meters, and upgrade flows.

### 8. Platform Super Admin Console (`/admin`)
- Accessible to platform super administrators.
- Monitor global MRR, manage tenant organizations (suspend/reactivate), review all platform users, and inspect global audit logs.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v22+)
- npm (v9+)
- *(Optional)* MongoDB Atlas URI — If omitted, QUBIX automatically initializes an embedded, zero-dependency in-memory MongoDB instance with pre-seeded demo data!

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Backend Server
```bash
npm run dev:server
```
The server will start on `http://localhost:5000` and automatically seed the demo company and users.

### 3. Run Frontend Client
In a second terminal:
```bash
npm run dev:client
```
The client will start on `http://localhost:5173`.

---

## 🔑 Demo Login Credentials

The database automatically seeds realistic demo records on startup:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Organization Owner** | `sarah.jenkins@acme.com` | `Password123!` | Acme Technologies Workspace (`acme-corp`) |
| **Team Lead / Architect** | `alex.rivera@acme.com` | `Password123!` | Technical Lead & Workflows |
| **Product Designer** | `emma.watson@acme.com` | `Password123!` | UI/UX & Ticket Drawer |
| **Platform Super Admin** | `admin@qubix.io` | `Password123!` | Global Platform Console (`/admin`) |

*Tip: The login page includes quick-fill buttons for instant 1-click authentication.*

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Lucide React, React Router v7, TanStack Query, Recharts, jsPDF.
- **Backend**: Node.js, Express, TypeScript, Mongoose, MongoDB, JWT (with refresh token rotation), Socket.IO, Multer, Helmet, Nodemailer.
- **DevOps & QA**: Docker, Docker Compose, Nginx, Vitest, Supertest, MongoMemoryServer.

---

## 🧪 Automated Testing

Run the automated multi-tenant isolation and security test suite:
```bash
npm run test:server
```

---

## 📦 Production Build

```bash
npm run build
```
Builds both the backend (`server/dist`) and client (`client/dist`).


# QubixTicketing
