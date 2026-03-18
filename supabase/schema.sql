-- Player Funnel OS – Supabase Schema
-- Run this in the Supabase SQL Editor to set up your database.

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- Table: campaigns
-- One row per Telegram group / marketing source
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaigns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'telegram',
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: clicks
-- One row per link click (redirect hit)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clicks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ref_code     TEXT NOT NULL UNIQUE,
  ip           TEXT,
  user_agent   TEXT,
  timestamp    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: users
-- Matched players (connected click → real person)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code           TEXT NOT NULL UNIQUE,
  telegram_username  TEXT,
  campaign_id        UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  last_activity      TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Table: events
-- signup / deposit / activity events per user
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN ('signup', 'deposit', 'activity')),
  amount     NUMERIC(12, 2),
  timestamp  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Indexes for common query patterns
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clicks_campaign_id ON clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_clicks_ref_code ON clicks(ref_code);
CREATE INDEX IF NOT EXISTS idx_users_ref_code ON users(ref_code);
CREATE INDEX IF NOT EXISTS idx_users_campaign_id ON users(campaign_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);

-- ─────────────────────────────────────────────
-- Row Level Security (RLS) — disable for server-side access
-- We use service role key in API routes so RLS is bypassed.
-- Enable only if you add user-facing reads.
-- ─────────────────────────────────────────────
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE users     ENABLE ROW LEVEL SECURITY;
ALTER TABLE events    ENABLE ROW LEVEL SECURITY;

-- Allow full access via service role (server-side API routes)
-- Drop first so this script is safe to re-run
DROP POLICY IF EXISTS "service_role_all" ON campaigns;
DROP POLICY IF EXISTS "service_role_all" ON clicks;
DROP POLICY IF EXISTS "service_role_all" ON users;
DROP POLICY IF EXISTS "service_role_all" ON events;

CREATE POLICY "service_role_all" ON campaigns FOR ALL USING (true);
CREATE POLICY "service_role_all" ON clicks    FOR ALL USING (true);
CREATE POLICY "service_role_all" ON users     FOR ALL USING (true);
CREATE POLICY "service_role_all" ON events    FOR ALL USING (true);
