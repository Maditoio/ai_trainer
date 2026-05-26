ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "withdrawal_fee_percent" numeric(8, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "minimum_withdrawal_amount" numeric(18, 8) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "fee_percent" numeric(8, 4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "fee_amount" numeric(18, 8) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD COLUMN IF NOT EXISTS "net_amount" numeric(18, 8) DEFAULT '0' NOT NULL;--> statement-breakpoint
UPDATE "withdrawal_requests"
SET "net_amount" = "amount"
WHERE "net_amount" = '0';
