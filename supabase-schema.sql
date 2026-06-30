-- ──────────────────────────────────────────────────────────────
-- Gym Attendance — database schema
-- Run this in Supabase: SQL Editor → New query → paste → Run.
-- ──────────────────────────────────────────────────────────────

-- Members (clients). Identified by phone number.
create table if not exists clients (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text not null unique,
  created_at timestamptz not null default now()
);

-- One row per member per gym-day. Holds In and Out time.
create table if not exists attendance (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  date       date not null,                 -- gym-local calendar date (YYYY-MM-DD)
  check_in   timestamptz not null,
  check_out  timestamptz,                    -- null until the member scans to leave
  created_at timestamptz not null default now(),
  unique (client_id, date)                   -- guarantees max one record per day
);

-- Fast lookups for the coach's "attendance for a date" view.
create index if not exists attendance_date_idx on attendance (date);
create index if not exists attendance_client_date_idx on attendance (client_id, date);

-- NOTE: All access goes through the server (service-role key), so we do not
-- expose these tables to the public anon key. Row Level Security is left off
-- because the anon key is never used here. If you later add client-side
-- Supabase access, enable RLS and add policies.
