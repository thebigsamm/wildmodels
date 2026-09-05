-- Identity verification: a user photographs themselves holding a one-time
-- code, an admin compares it against their profile photos, and an approved
-- profile gets a badge.
--
-- Verification selfies live in the PRIVATE "verification-photos" bucket, not
-- the public profile-photos one. They're only ever read by admin routes via
-- the service role, and are deleted once a request is reviewed.

alter table public.profiles
  add column if not exists is_verified boolean not null default false;

create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  photo_path text,
  status text not null default 'pending'
    check (status in ('pending', 'submitted', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz
);

create index if not exists verification_requests_user_idx
  on public.verification_requests (user_id);
create index if not exists verification_requests_status_idx
  on public.verification_requests (status);

alter table public.verification_requests enable row level security;

-- Users can read their own request (to see their code and current status).
-- All writes go through server routes using the service role, so there are
-- deliberately no insert/update policies here - a user can't mark themselves
-- approved.
drop policy if exists verification_requests_select_own on public.verification_requests;
create policy verification_requests_select_own on public.verification_requests
  for select using (user_id = auth.uid());
