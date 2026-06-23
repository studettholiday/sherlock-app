-- 033: Billing exemption for Studio Holiday (school_id = 1).
-- Mirrors 031's exemption of the public library (id = 11). A school with
-- billing_exempt = true is always treated as active: no trial expiry, no AI
-- conversation cap, and no trial-expired / activate-subscription prompts.
--
-- Studio Holiday (id = 1) is our own anchor studio, not a paying customer, so
-- it sits outside billing entirely. Scoped to id = 1 ONLY — touches no other
-- school and no other column.
--
-- SECURITY: billing_exempt is DB-only by design (see 031) — there is
-- intentionally NO API or UI path that sets it. Set only via SQL.
--
-- Idempotent — safe to re-run. Assumes the billing_exempt column already
-- exists (added by 031).

UPDATE schools SET billing_exempt = true WHERE id = 1;
