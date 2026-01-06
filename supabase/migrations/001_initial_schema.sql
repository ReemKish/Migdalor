-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (adapt to your Base44 user structure)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  -- Add other fields from your Base44 user model
  email_verified BOOLEAN DEFAULT FALSE
);

-- Add your other Base44 entities here
-- 01_ddl.sql
-- DDL for ClassroomKey, Crew, WaitingQueue, Lesson, Squad, Position, Zone,
-- PositionPermission, HackalonDepartment, HackalonTeam, HackalonSubmission, hackalonScheduleItems

-- ---------- Helpers (Supabase-style JWT claims) ----------
-- Adjust these if your JWT stores claims differently.
create or replace function public.current_email()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'email', '')
$$;

create or replace function public.current_role()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'role', '')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_role() = 'admin'
$$;

create or replace function public.current_hackalon_team()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'hackalon_team', '')
$$;

-- ---------- Enum types ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'room_type_enum') then
    create type public.room_type_enum as enum ('צוותי', 'פלוגתי');
  end if;

  if not exists (select 1 from pg_type where typname = 'key_status_enum') then
    create type public.key_status_enum as enum ('available', 'taken');
  end if;

  if not exists (select 1 from pg_type where typname = 'preferred_type_enum') then
    create type public.preferred_type_enum as enum ('צוותי', 'פלוגתי', 'any');
  end if;

  if not exists (select 1 from pg_type where typname = 'lesson_status_enum') then
    create type public.lesson_status_enum as enum ('pending', 'assigned', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'hackalon_submission_type_enum') then
    create type public.hackalon_submission_type_enum as enum ('specification', 'final_product');
  end if;

  if not exists (select 1 from pg_type where typname = 'hackalon_submission_method_enum') then
    create type public.hackalon_submission_method_enum as enum ('file', 'link');
  end if;

  if not exists (select 1 from pg_type where typname = 'hackalon_event_type_enum') then
    create type public.hackalon_event_type_enum as enum ('פורום גדודי', 'פורום מדורי', 'הרצאת אורח', 'מתפללים', 'ארוחה');
  end if;
end $$;

-- ---------- Core tables ----------
create table if not exists public.classroomkey (
  id text primary key,
  room_number text not null,
  room_type public.room_type_enum not null,
  zone text,
  has_computers boolean not null default false,
  status public.key_status_enum not null default 'available',
  current_holder text,
  checkout_time timestamptz,
  checkout_start_time text, -- HH:MM
  checkout_end_time text,   -- HH:MM
  checked_out_by text,      -- email
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  is_available_today boolean not null default true,
  manual_misdar_assignment text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (room_number)
);

create table if not exists public.crew (
  id text primary key,
  name text not null unique,
  contact text,
  notes text,
  "order" numeric not null default 0,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.waitingqueue (
  id text primary key,
  crew_name text not null,
  crew_manager text,      -- email of requester (as per schema)
  platoon_name text,
  date date not null,
  preferred_type public.preferred_type_enum,
  start_time text not null, -- HH:MM
  end_time text not null,   -- HH:MM
  priority numeric,
  notes text,
  created_by text not null default public.current_email(),
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.lesson (
  id text primary key,
  crew_manager text not null, -- email
  crew_name text not null,
  platoon_name text,
  date date not null,
  start_time text not null, -- HH:MM
  end_time text not null,   -- HH:MM
  room_type_needed public.room_type_enum not null,
  needs_computers boolean not null default false,
  assigned_key text, -- room_number of assigned key
  status public.lesson_status_enum not null default 'pending',
  notes text,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.squad (
  id text primary key,
  squad_number text not null,
  platoon_name text not null,
  contact text,
  notes text,
  "order" numeric not null default 0,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (squad_number, platoon_name)
);

create table if not exists public.position_role (
  id text primary key,
  title text not null unique,
  "order" numeric not null default 0,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.zone (
  id text primary key,
  name text not null unique,
  "order" numeric not null default 0,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.positionpermission (
  id text primary key,
  position_id text not null,
  position_name text not null,
  has_classroom_management_access boolean not null default false,
  pages_access text[] not null default array[]::text[],
  entity_permissions jsonb not null default '{}'::jsonb,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  unique (position_id)
);

-- ---------- Hackalon tables ----------
create table if not exists public.hackalon_department (
  id text primary key,
  name text not null unique,
  icon text not null default 'Users',
  classroom_number text,
  "order" numeric not null default 0,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.hackalon_team (
  id text primary key,
  name text not null unique,
  department_name text not null,
  problem_name text,
  problem_intro text,
  problem_objective text,
  problem_requirements text,
  member_names text[] not null default array[]::text[],
  specification_deadline timestamptz,
  specification_template_url text,
  final_product_deadline timestamptz,
  "order" numeric not null default 0,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.hackalon_submission (
  id text primary key,
  team_name text not null,
  submission_type public.hackalon_submission_type_enum not null,
  submission_method public.hackalon_submission_method_enum not null default 'file',
  file_url text,
  file_name text,
  uploaded_by text, -- email
  upload_date timestamptz,
  is_late boolean not null default false,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create table if not exists public.hackalon_scheduleitem (
  id text primary key,
  title text not null,
  description text,
  date date not null,
  start_time text not null, -- HH:MM
  end_time text not null,   -- HH:MM
  event_type public.hackalon_event_type_enum not null default 'פורום מדורי',
  "order" numeric not null default 0,
  created_by text,
  created_by_id text,
  is_sample boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- ---------- Optional: lightweight timestamp trigger ----------
create or replace function public.set_updated_date()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'classroomkey','crew','waitingqueue','lesson','squad','position_role','zone',
    'positionpermission','hackalon_department','hackalon_team','hackalon_submission','hackalon_scheduleitem'
  ]
  loop
    execute format('drop trigger if exists trg_%I_updated_date on public.%I;', t, t);
    execute format('create trigger trg_%I_updated_date before update on public.%I for each row execute function public.set_updated_date();', t, t);
  end loop;
end $$;

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
-- Add other indexes as needed

-- Create updated_date trigger function
CREATE OR REPLACE FUNCTION update_updated_date_column()
RETURNS TRIGGER LANGUAGE 'plpgsql' AS $$
BEGIN
    NEW.updated_date = NOW();
    RETURN NEW;
END;
$$;

-- Add updated_date triggers
CREATE TRIGGER update_users_updated_date
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_date_column();