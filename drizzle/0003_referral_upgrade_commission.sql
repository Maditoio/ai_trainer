ALTER TYPE "ledger_type" ADD VALUE IF NOT EXISTS 'referral_commission';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_commission_paid_at" timestamp with time zone;
