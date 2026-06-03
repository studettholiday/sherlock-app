-- 025: per-school monthly conversation metering + token cost tracking
ALTER TABLE schools ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'trial';
ALTER TABLE schools ADD COLUMN IF NOT EXISTS conversation_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS input_tokens_month INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS output_tokens_month INTEGER NOT NULL DEFAULT 0;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS month_reset_at TIMESTAMPTZ DEFAULT NOW();
