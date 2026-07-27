-- ============================================================
-- DLA Kappas: Member Training Tracker
-- Run this once in Supabase SQL Editor (New query -> paste -> Run)
-- Safe to run on the existing project; only adds new objects.
-- ============================================================

create table if not exists member_training (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references members(id) on delete cascade,
  training_name text not null,
  completed_date date,
  status        text not null default 'Pending'
                  check (status in ('Complete', 'Pending', 'Expired')),
  verified_by   text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Keep updated_at fresh on edits
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_member_training_updated_at on member_training;
create trigger trg_member_training_updated_at
  before update on member_training
  for each row execute function set_updated_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table member_training enable row level security;

-- Members can view their own training records
drop policy if exists "Members can view own training" on member_training;
create policy "Members can view own training"
  on member_training for select
  using (member_id = auth.uid());

-- Admins can view all training records
drop policy if exists "Admins can view all training" on member_training;
create policy "Admins can view all training"
  on member_training for select
  using (
    exists (
      select 1 from members
      where members.id = auth.uid() and members.is_admin = true
    )
  );

-- Only admins can insert/update/delete training records
drop policy if exists "Admins can insert training" on member_training;
create policy "Admins can insert training"
  on member_training for insert
  with check (
    exists (
      select 1 from members
      where members.id = auth.uid() and members.is_admin = true
    )
  );

drop policy if exists "Admins can update training" on member_training;
create policy "Admins can update training"
  on member_training for update
  using (
    exists (
      select 1 from members
      where members.id = auth.uid() and members.is_admin = true
    )
  );

drop policy if exists "Admins can delete training" on member_training;
create policy "Admins can delete training"
  on member_training for delete
  using (
    exists (
      select 1 from members
      where members.id = auth.uid() and members.is_admin = true
    )
  );

-- Helpful index for admin lookups by member
create index if not exists idx_member_training_member_id on member_training(member_id);
