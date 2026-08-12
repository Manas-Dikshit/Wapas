-- ============================================================================
-- Wapas — 0008_transporter_dashboard_data.sql
-- Adds the `load_recommendations` view used by the transporter dashboard's
-- "AI recommended loads" panel.
--
-- The dashboard previously rendered a hardcoded slice of `loads` flagged
-- `aiRecommended` in src/lib/mock-data.ts. Real recommendations need the
-- existing `backhaul_match_score()` function (0002_functions_triggers.sql)
-- applied across the signed-in transporter's trucks x open loads, and
-- PostgREST cannot express that correlated cross-product with a score ORDER BY
-- in a plain table query. The view does the join in SQL — reusing the existing
-- function, never reimplementing the matching logic in the frontend — and
-- `security_invoker = true` (Postgres 15+) keeps the base tables' RLS in force
-- for the invoking user.
--
-- Run in order after 0001-0004:
--   supabase db push
-- ============================================================================

-- For every open load x available truck the invoking user may see, compute the
-- backhaul match score with the existing immutable function. With
-- security_invoker the row-level security of `loads` and `trucks` still
-- applies as the calling user:
--   * loads  -> only `status = 'open'` rows (loads_select_open_or_own)
--   * trucks -> available trucks of anyone, plus the caller's own fleet
-- The dashboard then filters `transporter_id = <me>` to keep recommendations
-- scoped to its own fleet. `distinct on (l.id)` keeps the single best-scoring
-- truck per load so one load never appears twice.
create or replace view public.load_recommendations
with (security_invoker = true)
as
select distinct on (l.id)
  l.id                  as load_id,
  l.title               as load_title,
  l.origin_city,
  l.destination_city,
  l.weight_tons,
  l.pickup_date,
  l.budget,
  l.truck_type_needed,
  t.id                  as truck_id,
  t.transporter_id,
  t.reg_number          as truck_reg_number,
  t.type                as truck_type,
  t.current_city        as truck_current_city,
  public.backhaul_match_score(
    t.current_city,
    t.type,
    t.empty_leg,
    l.origin_city,
    coalesce(l.truck_type_needed, t.type)
  ) as match_score
from public.loads l
join public.trucks t on t.status = 'available'
where l.status = 'open'
order by l.id, match_score desc;

-- PostgREST only exposes relations the requesting role has privileges on, so
-- grant SELECT to the authenticated role (the base tables keep enforcing RLS
-- through the security_invoker view).
grant select on public.load_recommendations to authenticated;
