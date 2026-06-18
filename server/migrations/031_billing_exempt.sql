-- 031: Billing exemption for infrastructure schools (e.g. the public library).
-- A school with billing_exempt = true is always treated as active: no trial
-- expiry, no AI conversation cap, and no trial-expired / activate-subscription
-- prompts. This is OUR own infrastructure, not a customer, so it sits outside
-- billing entirely.
--
-- SECURITY: this flag is DB-only by design. There is intentionally NO API or UI
-- path that sets billing_exempt — it is a "free forever" switch, so allowing a
-- tenant to flip it would be giving the product away. Set it only via SQL.
--
-- Idempotent — safe to re-run.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS billing_exempt BOOLEAN NOT NULL DEFAULT false;

-- Exempt the public library (school_id = 11 — "Sherlock Public Library").
UPDATE schools SET billing_exempt = true WHERE id = 11;
