\# 🚀 TeamFlow — Team Task Manager



A full-stack web application for managing projects, assigning tasks, and tracking progress with \*\*role-based access control (Admin/Member)\*\*.



\---



\## 📋 Table of Contents



\- \[Features](#features)

\- \[Tech Stack](#tech-stack)

\- \[Project Structure](#project-structure)

\- \[Getting Started](#getting-started)

\- \[Environment Variables](#environment-variables)

\- \[API Endpoints](#api-endpoints)

\- \[Database Schema](#database-schema)

\- \[Role-Based Access](#role-based-access)

\- \[Deployment](#deployment)

\- \[Screenshots](#screenshots)



\---



\## ✨ Features



\- 🔐 \*\*Authentication\*\* — Signup, Login with JWT tokens \& bcrypt password hashing

\- 📁 \*\*Project Management\*\* — Create projects, assign team members, track progress

\- ✅ \*\*Task Management\*\* — Create tasks, set priority, due dates, and status tracking

\- 👥 \*\*Team Management\*\* — Invite members, manage roles (Admin / Member)

\- 📊 \*\*Dashboard\*\* — Live stats: total tasks, completed, in progress, overdue

\- 🔒 \*\*Role-Based Access Control\*\* — Admins manage everything; Members view/update assigned tasks

\- 🔍 \*\*Search \& Filter\*\* — Filter tasks by status, priority, and search by keyword

\- ⚠️ \*\*Overdue Detection\*\* — Automatically flags overdue tasks



\---



\## 🛠 Tech Stack



| Layer | Technology |

|-------|-----------|

| Frontend | React (Vite) |

| Backend | Node.js + Express |

| Database | PostgreSQL |

| Auth | JWT + bcrypt |

| Deployment | Railway (backend + DB) + Vercel (frontend) |



\---



\## 📂 Project Structure



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



\---



\## 🚀 Getting Started



\### Prerequisites



\- Node.js >= 20

\- PostgreSQL >= 14

\- npm or yarn



\### 1. Clone the Repository



```bash

git clone https://github.com/yourusername/team-task-manager.git

cd team-task-manager

```



\### 2. Install Dependencies



```bash

\# Backend

npm install



\# Frontend

cd client \&\& npm install

```



\### 3. Setup Environment Variables



```bash

cp .env.example .env

\# Edit .env with your values (see Environment Variables section)

```



\### 4. Setup Database



```bash

\# Connect to PostgreSQL and run the schema

psql -U postgres -d your\_db\_name -f server/schema.sql

```



\### 5. Run the App



```bash

\# Run backend + frontend together (development)

npm run dev



\# Or separately:

\# Backend → http://localhost:3000

node server/index.js



\# Frontend → http://localhost:5173

cd client \&\& npm run dev

```



\---



\## 🔑 Environment Variables



Create a `.env` file in the root directory:



```env

\# Server

PORT=3000

NODE\_ENV=development



\# Database

DATABASE\_URL=postgresql://user:password@localhost:5432/teamflow



\# Auth

JWT\_SECRET=your\_super\_secret\_jwt\_key\_here

JWT\_EXPIRES\_IN=7d



\# Frontend URL (for CORS)

CLIENT\_URL=http://localhost:5173

```



`.env.example` is included — never commit your real `.env` file.



\---



\## 📡 API Endpoints



\### Auth

| Method | Endpoint | Access | Description |

|--------|----------|--------|-------------|

| POST | `/api/auth/signup` | Public | Register new user |

| POST | `/api/auth/login` | Public | Login, returns JWT |

| GET | `/api/auth/me` | Auth | Get current user |



\### Projects

| Method | Endpoint | Access | Description |

|--------|----------|--------|-------------|

| GET | `/api/projects` | Auth | Get all projects for user |

| POST | `/api/projects` | Admin | Create new project |

| GET | `/api/projects/:id` | Auth | Get project details |

| PUT | `/api/projects/:id` | Admin | Update project |

| DELETE | `/api/projects/:id` | Admin | Delete project |



\### Tasks

| Method | Endpoint | Access | Description |

|--------|----------|--------|-------------|

| GET | `/api/tasks` | Auth | Get tasks (filtered by role) |

| POST | `/api/tasks` | Admin | Create new task |

| GET | `/api/tasks/:id` | Auth | Get task details |

| PUT | `/api/tasks/:id` | Auth | Update task (Admin: all fields; Member: status only) |

| DELETE | `/api/tasks/:id` | Admin | Delete task |



\### Members

| Method | Endpoint | Access | Description |

|--------|----------|--------|-------------|

| GET | `/api/members` | Auth | Get all team members |

| POST | `/api/members/invite` | Admin | Invite new member |

| PATCH | `/api/members/:id/role` | Admin | Change member role |

| DELETE | `/api/members/:id` | Admin | Remove member |



\---



\## 🗃 Database Schema



```sql

CREATE TABLE users (

&#x20; id          SERIAL PRIMARY KEY,

&#x20; name        VARCHAR(100) NOT NULL,

&#x20; email       VARCHAR(100) UNIQUE NOT NULL,

&#x20; password\_hash TEXT NOT NULL,

&#x20; role        VARCHAR(20) DEFAULT 'Member',

&#x20; created\_at  TIMESTAMP DEFAULT NOW()

);



CREATE TABLE projects (

&#x20; id          SERIAL PRIMARY KEY,

&#x20; name        VARCHAR(100) NOT NULL,

&#x20; description TEXT,

&#x20; created\_by  INT REFERENCES users(id),

&#x20; created\_at  TIMESTAMP DEFAULT NOW()

);



CREATE TABLE project\_members (

&#x20; project\_id  INT REFERENCES projects(id) ON DELETE CASCADE,

&#x20; user\_id     INT REFERENCES users(id) ON DELETE CASCADE,

&#x20; PRIMARY KEY (project\_id, user\_id)

);



CREATE TABLE tasks (

&#x20; id          SERIAL PRIMARY KEY,

&#x20; title       VARCHAR(200) NOT NULL,

&#x20; description TEXT,

&#x20; project\_id  INT REFERENCES projects(id) ON DELETE CASCADE,

&#x20; assignee\_id INT REFERENCES users(id),

&#x20; created\_by  INT REFERENCES users(id),

&#x20; status      VARCHAR(30) DEFAULT 'Todo',   -- Todo | In Progress | Done

&#x20; priority    VARCHAR(20) DEFAULT 'Medium', -- High | Medium | Low

&#x20; due\_date    DATE,

&#x20; created\_at  TIMESTAMP DEFAULT NOW(),

&#x20; updated\_at  TIMESTAMP DEFAULT NOW()

);

```



\---



\## 🔒 Role-Based Access



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



\---



\## 🚂 Deployment



\### Deploy to Railway (Backend + Database)



1\. \*\*Push to GitHub:\*\*

```bash

git init

git add .

git commit -m "initial commit"

git remote add origin https://github.com/yourname/team-task-manager.git

git push -u origin main

```



2\. \*\*Create Railway project:\*\*

&#x20;  - Go to \[railway.app](https://railway.app) → New Project

&#x20;  - Click \*\*GitHub Repository\*\* → select your repo

&#x20;  - Railway auto-detects Node.js and deploys



3\. \*\*Add PostgreSQL:\*\*

&#x20;  - Inside Railway project → \*\*New Service → Database → PostgreSQL\*\*

&#x20;  - `DATABASE\_URL` is auto-injected into your app



4\. \*\*Set environment variables:\*\*

&#x20;  - Service → \*\*Variables\*\* tab → add `JWT\_SECRET`, `NODE\_ENV=production`



5\. \*\*Generate public domain:\*\*

&#x20;  - Service → \*\*Settings → Networking → Generate Domain\*\*



\### Deploy Frontend to Vercel



```bash

cd client

npm run build

npx vercel --prod

```



Set `VITE\_API\_URL=https://your-app.up.railway.app` in Vercel environment variables.



\### `railway.json`



```json

{

&#x20; "$schema": "https://railway.app/railway.schema.json",

&#x20; "build": {

&#x20;   "builder": "NIXPACKS",

&#x20;   "buildCommand": "npm run build"

&#x20; },

&#x20; "deploy": {

&#x20;   "startCommand": "npm start",

&#x20;   "healthcheckPath": "/api/health",

&#x20;   "restartPolicyType": "ON\_FAILURE"

&#x20; }

}

```



\---



\## 🧪 Demo Credentials



| Role | Email | Password |

|------|-------|----------|

| Admin | admin@team.com | admin123 |

| Member | member@team.com | member123 |



> ⚠️ Change these before deploying to production.



\---



\## 📄 License



MIT License — feel free to use and modify for your own projects.



\---



\## 🤝 Contributing



1\. Fork the repository

2\. Create a feature branch: `git checkout -b feature/your-feature`

3\. Commit changes: `git commit -m 'Add your feature'`

4\. Push to branch: `git push origin feature/your-feature`

5\. Open a Pull Request



\---



Made with ❤️ by \[Your Name](https://github.com/yourusername)

