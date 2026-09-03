-- Removes the pricing feature entirely, including any data already entered.
-- The corresponding code was reverted in commit 88580ce.

alter table public.profiles drop column if exists price_short_time;
alter table public.profiles drop column if exists price_overnight;
alter table public.profiles drop column if exists price_weekend;
