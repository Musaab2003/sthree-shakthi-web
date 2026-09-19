-- ==========================================================
-- Sthree Shakthi Web Platform - Turso (LibSQL/SQLite) Schema
-- ==========================================================

-- 1. Publications & Community Submissions Table
CREATE TABLE IF NOT EXISTS publications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  author_club TEXT,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  embed_url TEXT,
  cover_image TEXT NOT NULL,
  tags TEXT,
  status TEXT DEFAULT 'pending',
  is_featured INTEGER DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  rejected_reason TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 5
);

-- 2. Newsletter Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- 3. Admin Accounts Table (Storing Cryptographically Hashed Passwords)
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL, -- SHA-256 Hashed Password
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Default Admin User (Password: admin123 -> SHA-256 Hashed)
INSERT OR IGNORE INTO admin_users (username, email, password_hash, role)
VALUES (
  'admin',
  'admin@cluster05.org',
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'super_admin'
);
