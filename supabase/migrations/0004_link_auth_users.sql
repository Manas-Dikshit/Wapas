-- ============================================================================
-- Wapas — 0004_link_auth_users.sql
-- Activates real Supabase Auth: links profiles.auth_user_id to auth.users,
-- stores email, and turns on the handle_new_user() trigger that was left
-- commented out in 0002_functions_triggers.sql.
--
-- Run after 0001-0003 (supabase db push, or paste into the SQL Editor).
-- ============================================================================

alter table public.profiles
  add column if not exists email text;

-- profiles.auth_user_id was already declared `unique` in 0001_init_schema.sql,
-- so this only adds the FK relationship (no extra index needed).
alter table public.profiles
  add constraint profiles_auth_user_fk
  foreign key (auth_user_id) references auth.users(id) on delete cascade;

-- Re-create handle_new_user() to also capture email and avoid duplicate
-- profile rows if a user is inserted twice (e.g. re-running a migration).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (auth_user_id, email, full_name, company_name, role, city)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'New user'), '@', 1)),
    new.raw_user_meta_data ->> 'company_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'shipper'),
    new.raw_user_meta_data ->> 'city'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

-- This is the trigger that was commented out in 0002_functions_triggers.sql —
-- now that auth_user_id is a real FK to auth.users, it's safe to activate.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();