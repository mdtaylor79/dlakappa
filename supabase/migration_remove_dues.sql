-- ============================================================
-- Migration: remove dues/payment tracking, switch tiers to
-- Subscribing Member / New Member
--
-- Run this in: Supabase Dashboard > SQL Editor > New query
-- (Run this INSTEAD of re-running schema.sql — your tables
-- already exist, this just updates them.)
-- ============================================================

-- Map any existing test data to the new tier values before
-- the old constraint is replaced.
update public.members
  set membership_tier = case
    when membership_tier = 'general' then 'subscribing'
    when membership_tier = 'senior' then 'new'
    else membership_tier
  end;

alter table public.members
  drop constraint if exists members_membership_tier_check;

alter table public.members
  add constraint members_membership_tier_check
  check (membership_tier in ('subscribing', 'new'));

alter table public.members drop column if exists dues_status;
alter table public.members drop column if exists dues_paid_at;

-- Simplify the admin-field guard now that dues fields are gone.
create or replace function public.protect_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;
