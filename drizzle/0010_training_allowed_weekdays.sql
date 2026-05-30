ALTER TABLE "platform_settings"
ADD COLUMN IF NOT EXISTS "training_allowed_weekdays" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL;
