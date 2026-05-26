DROP INDEX IF EXISTS "submissions_user_question_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_country_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_country_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text;
