-- ============================================================
-- CareConnect Database Schema
-- Run this in your Supabase SQL editor (Project > SQL Editor)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ── Doctors ─────────────────────────────────────────────────
create table if not exists doctors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text,
  avatar_url  text,
  clinic      text,
  created_at  timestamptz default now()
);

-- ── Patients ────────────────────────────────────────────────
-- patient.id links to Clerk's user ID (text) so auth is seamless
create table if not exists patients (
  id                 text primary key,  -- Clerk user_id e.g. "user_2abc..."
  name               text not null,
  dob                date,
  mrn                text unique,
  insurance          text,
  primary_doctor_id  uuid references doctors(id),
  created_at         timestamptz default now()
);

-- ── Lab Reports ─────────────────────────────────────────────
create table if not exists lab_reports (
  id           uuid primary key default gen_random_uuid(),
  patient_id   text references patients(id) on delete cascade,
  title        text not null,
  date         date,
  short_date   text,
  order_number text,
  lab_location text,
  status       text check (status in ('normal', 'review', 'attention')),
  status_text  text,
  created_at   timestamptz default now()
);

-- ── Test Parameters ─────────────────────────────────────────
create table if not exists test_parameters (
  id                uuid primary key default gen_random_uuid(),
  report_id         uuid references lab_reports(id) on delete cascade,
  name              text not null,
  value             text,
  unit              text,
  marker_percentage numeric,
  status            text,
  status_label      text,
  low_label         text,
  normal_label      text,
  high_label        text,
  reference_range   text
);

-- ── Physician Notes ─────────────────────────────────────────
create table if not exists physician_notes (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid references lab_reports(id) on delete cascade,
  doctor_id   uuid references doctors(id),
  message     text,
  created_at  timestamptz default now()
);

-- ── Appointments ────────────────────────────────────────────
create table if not exists appointments (
  id          uuid primary key default gen_random_uuid(),
  patient_id  text references patients(id) on delete cascade,
  doctor_id   uuid references doctors(id),
  date        date,
  time        text,
  location    text,
  type        text,
  status      text check (status in ('upcoming', 'completed', 'cancelled')),
  created_at  timestamptz default now()
);

-- ── Medications (new) ────────────────────────────────────────
create table if not exists medications (
  id                    uuid primary key default gen_random_uuid(),
  patient_id            text references patients(id) on delete cascade,
  prescribing_doctor_id uuid references doctors(id),
  name                  text not null,
  dosage                text,
  frequency             text,
  started_at            date,
  ended_at              date,           -- null = currently active
  notes                 text,
  created_at            timestamptz default now()
);

-- ── Doctor–Patient Messages ──────────────────────────────────
create table if not exists messages (
  id           uuid primary key default gen_random_uuid(),
  patient_id   text references patients(id) on delete cascade,
  sender_type  text check (sender_type in ('doctor', 'patient', 'system')),
  sender_id    text,                   -- doctor id or patient id
  sender_name  text,
  sender_role  text,
  sender_avatar text,
  text         text,
  is_read      boolean default false,
  created_at   timestamptz default now()
);

-- ── AI Chat History ──────────────────────────────────────────
create table if not exists chat_history (
  id               uuid primary key default gen_random_uuid(),
  patient_id       text references patients(id) on delete cascade,
  context_report_id uuid references lab_reports(id) on delete set null,
  role             text check (role in ('user', 'assistant')),
  text             text not null,
  created_at       timestamptz default now()
);

-- ── Historical Metabolic Trends ──────────────────────────────
create table if not exists historical_trends (
  id          uuid primary key default gen_random_uuid(),
  patient_id  text references patients(id) on delete cascade,
  date        text,                    -- e.g. "May 2023"
  glucose     numeric,
  a1c         numeric,
  sodium      numeric,
  potassium   numeric
);

-- ── Notifications ────────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  patient_id  text references patients(id) on delete cascade,
  title       text not null,
  description text,
  type        text check (type in ('lab', 'appointment', 'message', 'system')),
  is_read     boolean default false,
  created_at  timestamptz default now()
);


-- ============================================================
-- Row Level Security (RLS)
-- Patients can only see their own data.
-- The server uses the service-role key which bypasses RLS.
-- ============================================================

alter table patients          enable row level security;
alter table lab_reports        enable row level security;
alter table test_parameters    enable row level security;
alter table physician_notes    enable row level security;
alter table appointments       enable row level security;
alter table medications        enable row level security;
alter table messages           enable row level security;
alter table chat_history       enable row level security;
alter table historical_trends  enable row level security;
alter table notifications      enable row level security;
alter table doctors            enable row level security;

-- Patients: each user sees only their own row
create policy "patients_self" on patients
  for all using (id = current_setting('app.current_patient_id', true));

-- All patient-owned tables: same pattern
create policy "lab_reports_own" on lab_reports
  for all using (patient_id = current_setting('app.current_patient_id', true));

create policy "appointments_own" on appointments
  for all using (patient_id = current_setting('app.current_patient_id', true));

create policy "medications_own" on medications
  for all using (patient_id = current_setting('app.current_patient_id', true));

create policy "messages_own" on messages
  for all using (patient_id = current_setting('app.current_patient_id', true));

create policy "chat_history_own" on chat_history
  for all using (patient_id = current_setting('app.current_patient_id', true));

create policy "historical_trends_own" on historical_trends
  for all using (patient_id = current_setting('app.current_patient_id', true));

create policy "notifications_own" on notifications
  for all using (patient_id = current_setting('app.current_patient_id', true));

-- Test parameters and physician notes are readable if the parent report is accessible
create policy "test_parameters_own" on test_parameters
  for all using (
    report_id in (
      select id from lab_reports
      where patient_id = current_setting('app.current_patient_id', true)
    )
  );

create policy "physician_notes_own" on physician_notes
  for all using (
    report_id in (
      select id from lab_reports
      where patient_id = current_setting('app.current_patient_id', true)
    )
  );
-- Doctors are readable by anyone authenticated
create policy "doctors_read" on doctors
  for select using (true);
