# 🚀 TeamFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking progress with **role-based access control (Admin / Member)**.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Role-Based Access](#-role-based-access)
- [Deployment on Railway](#-deployment-on-railway)

---

## ✨ Features

- 🔐 **Authentication** — Signup & Login with JWT tokens, passwords hashed with bcrypt
- 📁 **Project Management** — Create projects, assign team members, view progress
- ✅ **Task Management** — Create tasks with title, description, priority, due date, and status
- 👥 **Team Members** — Invite members, change roles (Admin ↔ Member), remove users
- 📊 **Dashboard** — Live stats: total tasks, completed, in progress, overdue, project count
- 🔒 **Role-Based Access** — Admins manage everything; Members can only update their own task status
- 🔍 **Search & Filter** — Filter tasks by status (Todo / In Progress / Done / Overdue), search by keyword
- ⚠️ **Overdue Detection** — Tasks past due date that are not Done are flagged automatically

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) — single HTML artifact |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Deployment | Railway (backend + PostgreSQL) |

---

## 📂 Project Structure

```
teamflow/
├── server/
│   ├── index.js              # Express app entry point, serves React build in production
│   ├── db.js                 # PostgreSQL connection pool (pg)
│   ├── middleware/
│   │   └── auth.js           # authenticate (JWT verify) + adminOnly (role guard)
│   └── routes/
│       ├── auth.js           # POST /signup, POST /login, GET /me
│       ├── projects.js       # Full CRUD for projects + member assignment
│       ├── tasks.js          # Full CRUD for tasks, role-filtered GET
│       └── members.js        # GET all, POST invite, PATCH role, DELETE
├── client/
│   └── (React frontend — built to client/dist/ for production)
├── schema.sql                # PostgreSQL table definitions + optional seed
├── railway.json              # Railway build & deploy config
├── package.json              # Scripts: start, dev, build
├── .env.example              # Template for environment variables
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/teamflow.git
cd teamflow
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env and fill in your values
```

### 4. Set Up the Database

```bash
# Create the database
createdb teamflow

# Run the schema
psql -U postgres -d teamflow -f schema.sql
```

### 5. Run the Backend

```bash
# Development (auto-restarts on file change)
npm run dev

# Production
npm start
```

Server runs at: `http://localhost:3000`

### 6. Run the Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
PORT=3000
NODE_ENV=development

DATABASE_URL=postgresql://user:password@localhost:5432/teamflow

JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

> ⚠️ Never commit your `.env` file. It is listed in `.gitignore`.

---

## 📡 API Endpoints

All protected routes require: `Authorization: Bearer <token>`

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/signup` | Public | Register new user. Body: `{ name, email, password, role }` |
| POST | `/login` | Public | Login. Body: `{ email, password }`. Returns `{ token, user }` |
| GET | `/me` | ✅ JWT | Get current logged-in user |

### Projects — `/api/projects`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ JWT | Admin: all projects. Member: only assigned projects |
| GET | `/:id` | ✅ JWT | Single project with its members and tasks |
| POST | `/` | 🔒 Admin | Create project. Body: `{ name, description, member_ids[] }` |
| PUT | `/:id` | 🔒 Admin | Update project name, description, or members |
| DELETE | `/:id` | 🔒 Admin | Delete project (cascades to tasks) |

### Tasks — `/api/tasks`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ JWT | Admin: all tasks. Member: assigned tasks only. Query: `?status=&priority=&project_id=` |
| GET | `/:id` | ✅ JWT | Single task with assignee and project names |
| POST | `/` | 🔒 Admin | Create task. Body: `{ title, description, project_id, assignee_id, priority, due_date }` |
| PUT | `/:id` | ✅ JWT | Admin: update all fields. Member: update `status` only |
| DELETE | `/:id` | 🔒 Admin | Delete task |

### Members — `/api/members`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ JWT | List all team members |
| POST | `/invite` | 🔒 Admin | Invite member. Body: `{ name, email, role, password }` |
| PATCH | `/:id/role` | 🔒 Admin | Change role. Body: `{ role: "Admin" \| "Member" }` |
| DELETE | `/:id` | 🔒 Admin | Remove member |

### Health Check

```
GET /api/health  →  { "status": "ok" }
```

---

## 🗃 Database Schema

Defined in `schema.sql`:

```sql
users (id, name, email, password_hash, role, created_at)

projects (id, name, description, created_by → users.id, created_at)

project_members (project_id → projects.id, user_id → users.id)
  -- composite PK, both cascade on delete

tasks (
  id, title, description,
  project_id → projects.id,   -- CASCADE delete
  assignee_id → users.id,     -- SET NULL on delete
  created_by → users.id,
  status   CHECK IN ('Todo','In Progress','Done'),
  priority CHECK IN ('High','Medium','Low'),
  due_date, created_at, updated_at
)
```

Run schema:

```bash
psql -U postgres -d teamflow -f schema.sql
```

---

## 🔒 Role-Based Access

Enforced in `server/middleware/auth.js` via `authenticate` (JWT check) and `adminOnly` (role guard).

| Action | Admin | Member |
|--------|-------|--------|
| View dashboard stats | ✅ All data | ✅ Own data |
| View projects | ✅ All | ✅ Assigned only |
| Create / update / delete projects | ✅ | ❌ 403 |
| View tasks | ✅ All | ✅ Assigned only |
| Create / delete tasks | ✅ | ❌ 403 |
| Update task (all fields) | ✅ | ❌ |
| Update task status only | ✅ | ✅ Own tasks |
| Invite members | ✅ | ❌ 403 |
| Change member roles | ✅ | ❌ 403 |
| Remove members | ✅ | ❌ 403 |

---

## 🚂 Deployment on Railway

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourname/teamflow.git
git push -u origin main
```

### Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Click **GitHub Repository** → select `teamflow`
3. Railway auto-detects Node.js via Nixpacks and runs `npm run build` then `npm start`

### Step 3 — Add PostgreSQL

1. Inside Railway project → **New Service → Database → PostgreSQL**
2. `DATABASE_URL` is automatically injected into your app — no copy needed

### Step 4 — Set Environment Variables

In Railway dashboard → your service → **Variables** tab:

```
JWT_SECRET     = your_secret_key_here
NODE_ENV       = production
CLIENT_URL     = https://your-app.up.railway.app
```

### Step 5 — Run Schema Migration

In Railway dashboard → your PostgreSQL service → **Query** tab, paste and run the contents of `schema.sql`.

### Step 6 — Generate Public URL

Service → **Settings → Networking → Generate Domain**

Your app will be live at: `https://teamflow-production.up.railway.app`

### `railway.json` (already included)

```json
{
  "build":  { "builder": "NIXPACKS", "buildCommand": "npm run build" },
  "deploy": { "startCommand": "npm start", "healthcheckPath": "/api/health" }
}
```

---

## 📄 License

MIT — free to use and modify.
