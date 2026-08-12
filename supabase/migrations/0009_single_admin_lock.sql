-- ============================================================================
-- Wapas — 0009_single_admin_lock.sql
-- Single-admin lock: role is now decided SERVER-SIDE on signup, never trusted
-- from client-supplied metadata, and any pre-existing non-locked admin rows are
-- demoted in a one-time, explicit, auditable data-fix.
--
-- SECURITY CONTEXT
-- ----------------------------------------------------------------------------
-- Before this migration, handle_new_user() (created in 0004) wrote the role
-- straight out of `raw_user_meta_data ->> 'role'`:
--
--     coalesce(new.raw_user_meta_data ->> 'role', 'shipper')
--
-- `raw_user_meta_data` is what a caller passes as `options.data` to
-- supabase.auth.signUp() / signInWithOtp(). That is 100% client-controlled:
-- anyone can call signInWithOtp() directly (bypassing the register UI) with
-- `data: { role: 'admin' }` and get an `admin` profile row, which is_admin()
-- (0003) then treats as a platform admin. Frontend checks are bypassable, so
-- the fix must live in the DB trigger — not in application code.
--
-- THIS FILE
-- ----------------------------------------------------------------------------
-- 1. Rewrites handle_new_user() so role is derived server-side:
--      * email == 'manasdikshit48@gmail.com'  -> 'admin'   (the ONLY admin)
--      * metadata role is 'shipper'/'transporter' -> used as-is
--      * anything else (no role, or 'admin', or unknown)  -> 'shipper'
--    'admin' from metadata is therefore impossible for every other email.
-- 2. A one-time, explicit data-fix UPDATE that:
--      * promotes any existing profile whose email == locked address to admin
--      * demotes every OTHER existing admin row (including ones with a NULL
--        email, e.g. the seed's 'Admin User') to 'shipper'
--    Both branches are written out explicitly and commented so the migration
--    history itself shows exactly what was changed and why it is safe.
-- 3. is_admin() (0003) is intentionally UNCHANGED — it already returns
--    `role = 'admin'` on the caller's row, which now can only ever be true for
--    the locked email.
--
-- Run in order after 0001-0008:
--   supabase db push
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Single source of truth for the locked admin email. Keep this the ONLY place
-- that names it in the schema; the frontend guard mirrors it via a single
-- shared constant (src/lib/admin.ts) for defense in depth, never scattered.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_role text;
begin
  -- Role is decided here, server-side. The caller's `raw_user_meta_data` is
  -- never trusted for anything security-relevant.
  if lower(new.email) = lower('manasdikshit48@gmail.com') then
    -- The one true admin is locked to this exact email.
    v_role := 'admin';
  else
    -- Everyone else: honour the metadata role only if it is a legitimate
    -- non-admin role; 'admin' (or anything unknown/missing) falls back to
    -- 'shipper'. No other email can ever obtain 'admin' from metadata.
    v_role := coalesce(new.raw_user_meta_data ->> 'role', 'shipper');
    if v_role not in ('shipper', 'transporter') then
      v_role := 'shipper';
    end if;
  end if;

  insert into public.profiles (auth_user_id, email, full_name, company_name, role, city)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'New user'), '@', 1)),
    new.raw_user_meta_data ->> 'company_name',
    v_role,
    new.raw_user_meta_data ->> 'city'
  )
  on conflict (auth_user_id) do nothing;
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- ONE-TIME DATA FIX (explicit & auditable)
-- ----------------------------------------------------------------------------
-- Sealed into the migration history so it cannot silently run again or be
-- mistaken for application logic. Both statements are idempotent, safe, and
-- easily reversed by re-running the "reverse" update:
--   * reverse promote  -> update profiles set role = 'shipper' where email = '...'
--   * reverse demote   -> update profiles set role = 'admin' where <original row>
--
-- 1) PROMOTE: the locked email is the only admin. If an existing profile row
--    belongs to it but is not yet 'admin', elevate it.
update public.profiles
set role = 'admin'
where lower(email) = lower('manasdikshit48@gmail.com')
  and role <> 'admin';

-- 2) DEMOTE: any OTHER row still claiming 'admin' is not the
--    locked account and must be dropped to 'shipper'. This also catches rows
--    with a NULL email (e.g. the seed 'Admin User', which has no auth link) —
--    those cannot be verified as the locked email, so they are conservatively
--    demoted. Rows who never had 'admin' are untouched.
update public.profiles
set role = 'shipper'
where role = 'admin'
  and coalesce(lower(email), '') <> lower('manasdikshit48@gmail.com');

-- is_admin() from 0003 is left exactly as-is on purpose: with the above rules
-- in force, a row can be `role = 'admin'` only if it belongs to the locked
-- email, so the existing `role = 'admin'` check already means "the locked
-- admin". No RLS policies or migrations 0001-0008 are modified.