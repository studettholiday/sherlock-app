-- Capture owner consent at school-creation time.
-- All columns nullable so existing pre-consent schools aren't disrupted.
-- Versions are kept as text (the document's "Last updated" date), set server-side
-- from a constant; timestamps come from NOW() in the same INSERT as the school,
-- so all three are atomic with school creation.

ALTER TABLE schools ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tos_version TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS privacy_version TEXT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS minor_consent_attested_at TIMESTAMPTZ;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS minor_consent_attestation_version TEXT;
