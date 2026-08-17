-- Incident Report Tracker for DLA Kappas member portal
-- Mirrors RLS patterns used by member_training

create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.members(id) on delete set null,
  reporter_phone text,
  category text not null check (category in (
    'Code of Conduct Violation',
    'Violent / Physical Harm',
    'Hazing',
    'Financial Misconduct',
    'Fraud / Misrepresentation',
    'Abuse (Minor)',
    'Abuse / Harassment (Sexual Manner)',
    'Theft',
    'Property Damage',
    'Accident / Injury',
    'Law Enforcement Interaction',
    'Cybersecurity Event',
    'Other'
  )),
  incident_date date not null,
  location text not null,
  description text not null,
  involved_members text,
  signature text,
  signed_date date,
  status text not null default 'submitted'
    check (status in ('submitted', 'under_review', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.incident_reports enable row level security;

-- Members can submit their own incident reports
create policy "Members can insert own incident reports"
  on public.incident_reports
  for insert
  to authenticated
  with check (reporter_id = auth.uid());

-- Members can view only the reports they submitted
create policy "Members can view own incident reports"
  on public.incident_reports
  for select
  to authenticated
  using (reporter_id = auth.uid());

-- Admins (Polemarch/Vice Polemarch/KOR etc. flagged is_admin) can view all reports
create policy "Admins can view all incident reports"
  on public.incident_reports
  for select
  to authenticated
  using (
    exists (
      select 1 from public.members
      where members.id = auth.uid() and members.is_admin = true
    )
  );

-- Admins can update status (submitted -> under_review -> resolved)
create policy "Admins can update incident reports"
  on public.incident_reports
  for update
  to authenticated
  using (
    exists (
      select 1 from public.members
      where members.id = auth.uid() and members.is_admin = true
    )
  );
