-- Stores a snapshot of the editable fields as of the last time a profile
-- was approved (display_name, orientation, age, city, area, bio, whatsapp,
-- telegram). Captured fresh on every approval. Lets the admin Review modal
-- diff a pending/rejected submission against what's actually live right
-- now, instead of admins approving/rejecting blind with no way to see what
-- changed.

alter table public.profiles add column approved_snapshot jsonb;
