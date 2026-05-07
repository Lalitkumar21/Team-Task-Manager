-- TeamFlow Database Schema
-- Run: psql -U postgres -d your_db -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) DEFAULT 'Member' CHECK (role IN ('Admin','Member')),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_by  INT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_members (
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_by  INT REFERENCES users(id) ON DELETE SET NULL,
  status      VARCHAR(30) DEFAULT 'Todo' CHECK (status IN ('Todo','In Progress','Done')),
  priority    VARCHAR(20) DEFAULT 'Medium' CHECK (priority IN ('High','Medium','Low')),
  due_date    DATE,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- Seed demo data (optional - remove in production)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Alex Admin',  'admin@team.com',  '$2b$10$YourHashHere', 'Admin'),
  ('Maya Member', 'member@team.com', '$2b$10$YourHashHere', 'Member')
ON CONFLICT DO NOTHING;
