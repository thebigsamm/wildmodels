-- Lets the app tell a first-time approval apart from an edit being
-- re-approved, so notification emails can say "your profile is approved"
-- vs "your edit is approved" correctly. Set once, on the first successful
-- approval, and never touched again.

alter table public.profiles add column first_approved_at timestamptz;
