ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS price_short_time numeric,
  ADD COLUMN IF NOT EXISTS price_overnight numeric,
  ADD COLUMN IF NOT EXISTS price_weekend numeric;
