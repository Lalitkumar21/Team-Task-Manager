# 🚀 TeamFlow — Team Task Manager

A full-stack web application for managing projects, assigning tasks, and tracking progress with **role-based access control (Admin/Member)**.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Role-Based Access](#role-based-access)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## ✨ Features

- 🔐 **Authentication** — Signup, Login with JWT tokens & bcrypt password hashing
- 📁 **Project Management** — Create projects, assign team members, track progress
- ✅ **Task Management** — Create tasks, set priority, due dates, and status tracking
- 👥 **Team Management** — Invite members, manage roles (Admin / Member)
- 📊 **Dashboard** — Live stats: total tasks, completed, in progress, overdue
- 🔒 **Role-Based Access Control** — Admins manage everything; Members view/update assigned tasks
- 🔍 **Search & Filter** — Filter tasks by status, priority, and search by keyword
- ⚠️ **Overdue Detection** — Automatically flags overdue tasks

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deployment | Railway (backend + DB) + Vercel (frontend) |

---

## 📂 Project Structure

```
team-task-manager/
├── server/
│   ├── index.js              # Express entry point
│   ├── db.js                 # PostgreSQL connection pool
│   ├── middleware/
│   │   └── auth.js           # JWT verification + role guard
│   └── routes/
│       ├── auth.js           # POST /api/auth/signup, /login
│       ├── projects.js       # CRUD /api/projects
│       ├── tasks.js          # CRUD /api/tasks
│       └── members.js        # GET/PATCH /api/members
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Tasks.jsx
│   │   │   └── Members.jsx
│   │   └── components/
│   └── vite.config.js
├── railway.json
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL >= 14
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/team-task-manager.git
cd team-task-manager
```

### 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd client && npm install
```

### 3. Setup Environment Variables

```bash
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

### 4. Setup Database

```bash
# Connect to PostgreSQL and run the schema
psql -U postgres -d your_db_name -f server/schema.sql
```

### 5. Run the App

```bash
# Run backend + frontend together (development)
npm run dev

# Or separately:
# Backend → http://localhost:3000
node server/index.js

# Frontend → http://localhost:5173
cd client && npm run dev
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/teamflow

# Auth
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173
```

`.env.example` is included — never commit your real `.env` file.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user |

### Projects
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/projects` | Auth | Get all projects for user |
| POST | `/api/projects` | Admin | Create new project |
| GET | `/api/projects/:id` | Auth | Get project details |
| PUT | `/api/projects/:id` | Admin | Update project |
| DELETE | `/api/projects/:id` | Admin | Delete project |

### Tasks
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tasks` | Auth | Get tasks (filtered by role) |
| POST | `/api/tasks` | Admin | Create new task |
| GET | `/api/tasks/:id` | Auth | Get task details |
| PUT | `/api/tasks/:id` | Auth | Update task (Admin: all fields; Member: status only) |
| DELETE | `/api/tasks/:id` | Admin | Delete task |

### Members
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/members` | Auth | Get all team members |
| POST | `/api/members/invite` | Admin | Invite new member |
| PATCH | `/api/members/:id/role` | Admin | Change member role |
| DELETE | `/api/members/:id` | Admin | Remove member |

---

## 🗃 Database Schema

```sql
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role        VARCHAR(20) DEFAULT 'Member',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_by  INT REFERENCES users(id),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE project_members (
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id INT REFERENCES users(id),
  created_by  INT REFERENCES users(id),
  status      VARCHAR(30) DEFAULT 'Todo',   -- Todo | In Progress | Done
  priority    VARCHAR(20) DEFAULT 'Medium', -- High | Medium | Low
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 🔒 Role-Based Access

| Feature | Admin | Member |
|---------|-------|--------|
| View Dashboard | ✅ | ✅ |
| View Projects | ✅ All | ✅ Assigned only |
| Create / Delete Projects | ✅ | ❌ |
| View Tasks | ✅ All | ✅ Assigned only |
| Create / Delete Tasks | ✅ | ❌ |
| Update Task Status | ✅ | ✅ Own tasks |
| Invite Members | ✅ | ❌ |
| Change Member Roles | ✅ | ❌ |

---

## 🚂 Deployment

### Deploy to Railway (Backend + Database)

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/yourname/team-task-manager.git
git push -u origin main
```

2. **Create Railway project:**
   - Go to [railway.app](https://railway.app) → New Project
   - Click **GitHub Repository** → select your repo
   - Railway auto-detects Node.js and deploys

3. **Add PostgreSQL:**
   - Inside Railway project → **New Service → Database → PostgreSQL**
   - `DATABASE_URL` is auto-injected into your app

4. **Set environment variables:**
   - Service → **Variables** tab → add `JWT_SECRET`, `NODE_ENV=production`

5. **Generate public domain:**
   - Service → **Settings → Networking → Generate Domain**

### Deploy Frontend to Vercel

```bash
cd client
npm run build
npx vercel --prod
```

Set `VITE_API_URL=https://your-app.up.railway.app` in Vercel environment variables.

### `railway.json`

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 🧪 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@team.com | admin123 |
| Member | member@team.com | member123 |

> ⚠️ Change these before deploying to production.

---

## 📄 License

MIT License — feel free to use and modify for your own projects.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

Made with ❤️ by [Your Name](https://github.com/yourusername)
