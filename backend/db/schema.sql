-- Survey App Database Schema

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT UNIQUE NOT NULL,
  avatar      TEXT,
  role        TEXT DEFAULT 'user' CHECK(role IN ('user', 'manager', 'admin')),
  department  TEXT DEFAULT '',
  departments TEXT DEFAULT '',
  provider    TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surveys (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  department  TEXT DEFAULT 'Chung',
  schema      TEXT NOT NULL DEFAULT '{}',
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_active   INTEGER DEFAULT 1,
  is_public   INTEGER DEFAULT 1,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id           TEXT PRIMARY KEY,
  survey_id    TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response     TEXT NOT NULL DEFAULT '{}',
  is_complete  INTEGER DEFAULT 0,
  submitted_at DATETIME,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(survey_id, user_id)
);

CREATE TABLE IF NOT EXISTS departments (
  id         TEXT PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_user   ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_created  ON surveys(created_by);
CREATE INDEX IF NOT EXISTS idx_surveys_active   ON surveys(is_active);
