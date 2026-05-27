ALTER TABLE "platform_settings" ADD COLUMN IF NOT EXISTS "wrong_answer_reward_percent" numeric(8, 4) DEFAULT '50' NOT NULL;
