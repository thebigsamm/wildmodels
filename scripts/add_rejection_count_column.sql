-- Tracks how many times a profile (original submission or a later edit) has
-- been rejected, so the app can cap resubmission attempts instead of
-- allowing an unlimited reject/edit/reject loop, and so the dashboard/email
-- copy can tell the user how many attempts they have left.
--
-- Reset to 0 on every approval - once a user has a live, approved profile,
-- an unrelated future edit getting rejected shouldn't be penalized by
-- rejections from a previous, already-resolved round.

alter table public.profiles add column rejection_count integer not null default 0;
