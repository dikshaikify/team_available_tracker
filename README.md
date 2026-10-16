# Team Availability Tracker

Real-time team status dashboard with live synchronization via WebSockets.

## 🔗 Live Links

- **Frontend:** https://team-available-tracker.vercel.app
- **Backend API:** https://team-available-tracker.onrender.com
- **Repository:** https://github.com/dikshaikify/team_available_tracker

## ✨ Features

- 🔐 Login with any email/password (demo mode) + Google login button
- 👥 10 seeded team members with role, status, timezone
- 🎨 Responsive dashboard with color-coded status badges
- 🔄 One-click status toggles (Available / Busy / Away)
- ⚡ **Real-time WebSocket sync** across all open tabs
- 🔍 Filter by status and role
- 💾 Persistent storage in PostgreSQL (Neon)

## 🛠 Tech Stack

| Layer      | Tech                                           |
| ---------- | ---------------------------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS, Socket.IO client |
| Backend    | Node.js, Express, Socket.IO, JWT               |
| Database   | PostgreSQL (Neon) via Prisma ORM               |
| Deployment | Vercel (frontend), Render (backend)            |

## 🎯 How to Test

1. Open https://team-available-tracker.vercel.app
2. Log in with any email/password (e.g. `test@test.com` / `test`)
3. See the dashboard with 10 team members
4. Click a status button on any card
5. Open the same URL in a **second tab** → toggling in one updates the other **instantly**

## 🔌 API Endpoints

| Method  | Route                     | Purpose                                             |
| ------- | ------------------------- | --------------------------------------------------- |
| `POST`  | `/api/auth/login`         | Login (accepts any credentials in demo mode)        |
| `GET`   | `/api/members`            | List all team members                               |
| `PATCH` | `/api/members/:id/status` | Update a member's status (broadcasts via Socket.IO) |

## 🚀 Local Development

```bash
# Backend
cd server
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev   # http://localhost:4001

# Frontend (in another terminal)
cd client
npm install
npm run dev   # http://localhost:5173
```
