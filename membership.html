-- ============================================================
-- Denton-Lewisville Alumni Chapter — Kappa Alpha Psi Fraternity, Inc.
-- Supabase schema
--
-- Run this once in: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ---------- members ----------
-- One row per member, keyed to Supabase Auth's own user id.
create table if not exists public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  membership_tier text check (membership_tier in ('general', 'senior')),
  dues_status text not null default 'unpaid' check (dues_status in ('unpaid', 'pending', 'paid')),
  dues_paid_at timestamptz,
  join_date date default current_date,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;

-- ---------- events ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  event_time text,
  location text,
  created_by uuid references public.members (id),
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- ---------- rsvps ----------
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  member_id uuid references public.members (id),
  guest_name text,
  guest_email text,
  guest_count int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.rsvps enable row level security;

-- ============================================================
-- Helper: is_admin() — SECURITY DEFINER so it can read the
-- members table without recursing into its own RLS policy.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.members where id = auth.uid()), false);
$$;

-- ============================================================
-- Auto-create a members row whenever someone signs up via
-- Supabase Auth (email/password from portal/signup.html).
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Prevent members from setting their own dues_status /
-- dues_paid_at / is_admin — only an admin update can change them.
-- ============================================================
create or replace function public.protect_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.dues_status := old.dues_status;
    new.dues_paid_at := old.dues_paid_at;
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_admin_fields_trigger on public.members;
create trigger protect_admin_fields_trigger
  before update on public.members
  for each row execute procedure public.protect_admin_fields();

-- ============================================================
-- RLS policies — members
-- ============================================================
create policy "members read own row"
  on public.members for select
  using (auth.uid() = id or public.is_admin());

create policy "members update own row"
  on public.members for update
  using (auth.uid() = id or public.is_admin());

-- No public insert policy: rows are only created by the
-- handle_new_user trigger above.

-- ============================================================
-- RLS policies — events (public read, admin write)
-- ============================================================
create policy "anyone can read events"
  on public.events for select
  using (true);

create policy "admins manage events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- RLS policies — rsvps
-- ============================================================
create policy "anyone can rsvp"
  on public.rsvps for insert
  with check (true);

create policy "members read own rsvps, admins read all"
  on public.rsvps for select
  using (member_id = auth.uid() or public.is_admin());

create policy "admins manage rsvps"
  on public.rsvps for delete
  using (public.is_admin());

-- ============================================================
-- Make the first admin manually after your own account signs up:
--   update public.members set is_admin = true where email = 'you@example.com';
-- ============================================================
