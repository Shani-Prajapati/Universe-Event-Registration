-- ============================================================
-- UniVerse — College Event Registration System
-- database.sql
--
-- Run this file in MySQL to set up the database:
--   mysql -u root -p < database.sql
-- ============================================================

-- Create & use the database
CREATE DATABASE IF NOT EXISTS universe_db;
USE universe_db;

-- ============================================================
-- TABLE: users
-- Stores student accounts (signup/login)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT           PRIMARY KEY AUTO_INCREMENT,
  full_name     VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  college_id    VARCHAR(20),
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: events
-- Stores all college events shown on the homepage
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id          INT           PRIMARY KEY AUTO_INCREMENT,
  title       VARCHAR(150)  NOT NULL,
  icon        VARCHAR(10)   DEFAULT '🎉',
  category    ENUM('tech','cultural','workshop','sports') NOT NULL,
  description TEXT,
  event_date  VARCHAR(50),
  venue       VARCHAR(200),
  max_seats   INT           DEFAULT 100,
  color       VARCHAR(20)   DEFAULT '#4a9eff',
  badges      TEXT,         -- stored as JSON string
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: registrations
-- Stores student event registrations
-- ============================================================
CREATE TABLE IF NOT EXISTS registrations (
  id             INT          PRIMARY KEY AUTO_INCREMENT,
  user_id        INT          NOT NULL,
  event_id       INT          NOT NULL,
  full_name      VARCHAR(100) NOT NULL,
  mobile_number  VARCHAR(15)  NOT NULL,
  college_id     VARCHAR(20)  NOT NULL,
  department     VARCHAR(100),
  ticket_id      VARCHAR(30)  UNIQUE,
  registered_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  -- Foreign keys
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,

  -- One registration per user per event
  UNIQUE KEY unique_registration (user_id, event_id)
);

-- ============================================================
-- SEED DATA: Insert sample events
-- ============================================================
INSERT INTO events (title, icon, category, description, event_date, venue, max_seats, color, badges) VALUES
(
  'TECH FEST 2025', '💻', 'tech',
  'Three days of hackathons, coding contests, and tech talks by industry leaders.',
  'Apr 18–20', 'Main Auditorium', 120, '#4a9eff',
  '[{"label":"Flagship","color":"rgba(74,158,255,0.2)","text":"#4a9eff"},{"label":"Free Entry","color":"rgba(6,214,160,0.15)","text":"#06d6a0"}]'
),
(
  'CULTURAL NITE', '🎭', 'cultural',
  'Dance, music, drama, and fashion show — a night to celebrate campus talent.',
  'Apr 25', 'Open Air Theatre', 300, '#ff6b6b',
  '[{"label":"Cultural","color":"rgba(255,107,107,0.2)","text":"#ff6b6b"}]'
),
(
  'AI/ML WORKSHOP', '🤖', 'workshop',
  'Hands-on workshop on Machine Learning fundamentals using Python and TensorFlow.',
  'May 3', 'CS Lab A-204', 40, '#ffd166',
  '[{"label":"Workshop","color":"rgba(255,209,102,0.2)","text":"#ffd166"},{"label":"Limited","color":"rgba(255,107,107,0.15)","text":"#ff6b6b"}]'
),
(
  'SPORTS MANIA', '⚽', 'sports',
  'Inter-department tournament covering cricket, football, badminton, and more.',
  'May 10–12', 'Sports Complex', 200, '#06d6a0',
  '[{"label":"Sports","color":"rgba(6,214,160,0.2)","text":"#06d6a0"}]'
),
(
  'DESIGN JAM', '🎨', 'workshop',
  'UI/UX design sprint — conceptualize and prototype a real product in 6 hours.',
  'May 7', 'Art & Design Studio', 35, '#a78bfa',
  '[{"label":"Workshop","color":"rgba(167,139,250,0.2)","text":"#a78bfa"}]'
),
(
  'MUSIC FEST', '🎵', 'cultural',
  'Battle of bands, solo performances, and a DJ night to close the semester.',
  'May 15', 'Amphitheatre', 500, '#f97316',
  '[{"label":"Cultural","color":"rgba(249,115,22,0.2)","text":"#f97316"}]'
),
(
  'CYBERSECURITY CTF', '🔐', 'tech',
  'Capture The Flag competition. Test your hacking & security skills solo or in teams.',
  'May 20', 'Online + CS Dept', 80, '#4a9eff',
  '[{"label":"Tech","color":"rgba(74,158,255,0.2)","text":"#4a9eff"},{"label":"Prizes","color":"rgba(255,209,102,0.15)","text":"#ffd166"}]'
),
(
  'STARTUP PITCH', '🌱', 'tech',
  'Pitch your startup idea to real investors. Top 3 ideas get incubation support.',
  'May 22', 'Innovation Hub', 60, '#06d6a0',
  '[{"label":"Tech","color":"rgba(74,158,255,0.2)","text":"#4a9eff"},{"label":"Prizes","color":"rgba(6,214,160,0.15)","text":"#06d6a0"}]'
),
(
  'PHOTO WALK', '📸', 'cultural',
  'Guided photography walk around campus and heritage streets with workshops.',
  'May 18', 'Campus & City Tour', 25, '#ff6b6b',
  '[{"label":"Cultural","color":"rgba(255,107,107,0.2)","text":"#ff6b6b"}]'
);

-- ============================================================
-- USEFUL QUERIES (for reference)
-- ============================================================

-- View all registrations with user and event details:
-- SELECT r.ticket_id, u.full_name, u.email, e.title, r.mobile_number, r.college_id, r.department, r.registered_at
-- FROM registrations r
-- JOIN users u ON r.user_id = u.id
-- JOIN events e ON r.event_id = e.id
-- ORDER BY r.registered_at DESC;

-- Count registrations per event:
-- SELECT e.title, COUNT(r.id) AS total_registrations, e.max_seats
-- FROM events e
-- LEFT JOIN registrations r ON e.id = r.event_id
-- GROUP BY e.id;
