alter table public.profiles add column orientation text;
alter table public.profiles add constraint profiles_orientation_check
  check (orientation in ('straight', 'gay', 'bisexual'));
