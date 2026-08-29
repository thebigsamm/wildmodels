-- Defense-in-depth for the "edit requires re-approval" flow.
--
-- All legitimate profile edits now go through server routes (using the
-- service-role key, which bypasses RLS/grants entirely) that force
-- status back to "pending". This migration closes the remaining gap:
-- without it, a signed-in user could still call Supabase's own REST API
-- directly with their own session and write to any column on their own
-- profile row -- including setting status back to "approved" themselves,
-- or editing gender even though the UI no longer allows it.
--
-- After this runs, the only column a logged-in user can write directly
-- (not through one of this app's API routes) is photo_url, which
-- dashboard/photos/page.tsx still updates client-side when setting the
-- main photo. Everything else (display_name, gender, orientation, age,
-- city, area, bio, whatsapp, telegram, status, is_active,
-- is_hidden_by_owner, deleted_at, username, etc.) becomes writable only
-- by the service role, i.e. only through this app's own vetted routes.

revoke update on public.profiles from authenticated;
grant update (photo_url) on public.profiles to authenticated;
