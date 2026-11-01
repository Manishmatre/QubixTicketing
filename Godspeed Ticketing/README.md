# Godspeed Ticketing Portal

Dedicated internal operations, task tracking, and project delivery platform for Godspeed Home Sales and Godspeed Media.

---

## 🎯 Overview

Godspeed Ticketing Portal is a customized, high-velocity project and operations management system engineered specifically for Godspeed. It provides real-time task tracking, roadmap milestone management, team workload telemetries, and client support ticketing.

### Key Capabilities
- **Kanban Board**: Drag-and-drop workflow status sync with project-level filters.
- **Project & Milestone Management**: Full roadmap CRUD with target due dates and completion tracking.
- **Multi-Assignee Task Collaboration**: Assign multiple team members per task with primary leads.
- **Dedicated Database Isolation**: Independent MongoDB store (`GodspeedTicketing`).
- **Interactive Metrics**: Dynamic status-based color badges and KPI analytics.
- **Real-Time WebSockets**: Live updates without page refreshing.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 18
- MongoDB instance (Cloud or Local)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
The backend configuration is located in `server/.env`:
```env
PORT=4060
NODE_ENV=production
MONGO_URI=mongodb+srv://matremanish52_db_user:vTPwqMqSV977A17J@cluster0.vnevj1u.mongodb.net/GodspeedTicketing?compressors=zlib
JWT_SECRET=godspeed_ticketing_secure_jwt_secret_2026_x87
```

### 4. Running the Development Server
```bash
# Run backend server (Port 4060)
npm run dev:server

# Run frontend client (Port 5174 / 5173)
npm run dev:client
```

### 5. Production Build
```bash
npm run build
```
