ALTER TYPE "public"."ledger_type" ADD VALUE IF NOT EXISTS 'withdrawal';--> statement-breakpoint
ALTER TYPE "public"."ledger_type" ADD VALUE IF NOT EXISTS 'crypto_deposit';--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'approved', 'rejected', 'completed');--> statement-breakpoint
CREATE TABLE "crypto_deposits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nowpayments_payment_id" text NOT NULL,
	"pay_address" text NOT NULL,
	"pay_currency" text NOT NULL,
	"price_amount" numeric(18, 8) NOT NULL,
	"actually_paid" numeric(18, 8),
	"payment_status" text DEFAULT 'waiting' NOT NULL,
	"credited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crypto_deposits_nowpayments_payment_id_unique" UNIQUE("nowpayments_payment_id")
);
--> statement-breakpoint
CREATE TABLE "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(18, 8) NOT NULL,
	"polygon_address" text NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crypto_deposits" ADD CONSTRAINT "crypto_deposits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
