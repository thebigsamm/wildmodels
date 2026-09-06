-- Analytics: profile view and contact-reveal tracking.
--
-- One row per viewer, per profile, per event, per day. Refreshing a profile
-- doesn't inflate the count - the unique index below turns repeat inserts into
-- no-ops via on-conflict-do-nothing.
--
-- Signed-in viewers are stored by user id. Guests are stored as
-- sha256(ip + day + salt), which can't be reversed to an IP and rotates every
-- day, so this never becomes a log of who browsed what.

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_user_id uuid references auth.users(id) on delete set null,
  viewer_hash text,
  event text not null default 'view' check (event in ('view', 'contact_reveal')),
  day date not null default (now() at time zone 'utc')::date,
  created_at timestamptz not null default now()
);

create unique index if not exists profile_views_dedupe_idx
  on public.profile_views (
    profile_id,
    event,
    day,
    coalesce(viewer_user_id::text, viewer_hash, '')
  );

create index if not exists profile_views_created_idx
  on public.profile_views (created_at desc);

create index if not exists profile_views_profile_idx
  on public.profile_views (profile_id, event);

alter table public.profile_views enable row level security;

-- Deliberately no policies. Every read and write goes through this app's own
-- routes using the service role. A signed-in user hitting PostgREST directly
-- gets an empty result and can't forge rows for anyone.

-- ---------------------------------------------------------------------------
-- Aggregates run in the database rather than by shipping rows to Node, since
-- this is the one table that grows with traffic rather than with signups.
-- ---------------------------------------------------------------------------

-- Views and contact reveals per day, for the last N days.
create or replace function public.analytics_views_daily(days integer default 30)
returns table (day date, views bigint, contact_reveals bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    v.day,
    count(*) filter (where v.event = 'view') as views,
    count(*) filter (where v.event = 'contact_reveal') as contact_reveals
  from public.profile_views v
  where v.day >= (current_date - days)
  group by v.day
  order by v.day;
$$;

-- The question the whole feature exists to answer: does the verified badge
-- actually earn more views?
create or replace function public.analytics_views_by_verified()
returns table (is_verified boolean, profiles bigint, views bigint, contact_reveals bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.is_verified,
    count(distinct p.id) as profiles,
    count(v.id) filter (where v.event = 'view') as views,
    count(v.id) filter (where v.event = 'contact_reveal') as contact_reveals
  from public.profiles p
  left join public.profile_views v on v.profile_id = p.id
  where p.status = 'approved'
    and p.deleted_at is null
  group by p.is_verified;
$$;

-- Most-viewed profiles.
create or replace function public.analytics_top_profiles(limit_count integer default 10)
returns table (
  username text,
  display_name text,
  is_verified boolean,
  views bigint,
  contact_reveals bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.username,
    p.display_name,
    p.is_verified,
    count(v.id) filter (where v.event = 'view') as views,
    count(v.id) filter (where v.event = 'contact_reveal') as contact_reveals
  from public.profiles p
  join public.profile_views v on v.profile_id = p.id
  where p.deleted_at is null
  group by p.id, p.username, p.display_name, p.is_verified
  order by count(v.id) filter (where v.event = 'view') desc
  limit limit_count;
$$;

-- These are SECURITY DEFINER, so lock them to the service role only. Postgres
-- grants EXECUTE to PUBLIC by default, which would let any visitor call them.
revoke all on function public.analytics_views_daily(integer) from public;
revoke all on function public.analytics_views_daily(integer) from anon, authenticated;

revoke all on function public.analytics_views_by_verified() from public;
revoke all on function public.analytics_views_by_verified() from anon, authenticated;

revoke all on function public.analytics_top_profiles(integer) from public;
revoke all on function public.analytics_top_profiles(integer) from anon, authenticated;
