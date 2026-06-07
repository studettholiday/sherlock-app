-- 026: Paddle subscription tracking — customer/subscription ids + status mirror.
ALTER TABLE schools ADD COLUMN IF NOT EXISTS paddle_customer_id VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS paddle_subscription_id VARCHAR(255);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);
