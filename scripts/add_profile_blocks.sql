-- Block feature: mutual invisibility between two users.
--
-- Enforced at the database level rather than in app code, so it applies to
-- every query path (Browse, profile page, anything added later) and can't be
-- worked around from the client.

create table if not exists public.profile_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_user_id, blocked_user_id),
  check (blocker_user_id <> blocked_user_id)
);

create index if not exists profile_blocks_blocker_idx
  on public.profile_blocks (blocker_user_id);
create index if not exists profile_blocks_blocked_idx
  on public.profile_blocks (blocked_user_id);

alter table public.profile_blocks enable row level security;

-- You can only ever read and manage blocks you created. Nobody can query who
-- has blocked them - that would tell a harasser exactly who blocked them.
drop policy if exists profile_blocks_select_own on public.profile_blocks;
create policy profile_blocks_select_own on public.profile_blocks
  for select using (blocker_user_id = auth.uid());

drop policy if exists profile_blocks_insert_own on public.profile_blocks;
create policy profile_blocks_insert_own on public.profile_blocks
  for insert with check (blocker_user_id = auth.uid());

drop policy if exists profile_blocks_delete_own on public.profile_blocks;
create policy profile_blocks_delete_own on public.profile_blocks
  for delete using (blocker_user_id = auth.uid());

-- The visibility check has to see BOTH directions of a block, including rows
-- where someone else blocked the caller. RLS on profile_blocks (above) hides
-- those rows, and RLS does apply to subqueries inside policy expressions - so
-- this runs as SECURITY DEFINER to read past it. It only ever answers "is
-- there a block between me and this one user", which the caller could already
-- infer from the profile being invisible.
create or replace function public.is_blocked_with(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profile_blocks b
    where (b.blocker_user_id = auth.uid() and b.blocked_user_id = target_user_id)
       or (b.blocked_user_id = auth.uid() and b.blocker_user_id = target_user_id)
  );
$$;

grant execute on function public.is_blocked_with(uuid) to anon, authenticated;

-- RESTRICTIVE so it ANDs with the existing read policy instead of widening
-- access. For logged-out visitors auth.uid() is null, no block ever matches,
-- and browsing is unaffected.
drop policy if exists profiles_hide_blocked on public.profiles;
create policy profiles_hide_blocked on public.profiles
  as restrictive
  for select
  using (not public.is_blocked_with(user_id));
