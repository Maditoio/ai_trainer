CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" text PRIMARY KEY NOT NULL,
  "withdrawal_fee_percent" numeric(8, 4) DEFAULT '0' NOT NULL,
  "minimum_withdrawal_amount" numeric(18, 8) DEFAULT '0' NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

INSERT INTO "platform_settings" (
  "id",
  "withdrawal_fee_percent",
  "minimum_withdrawal_amount"
)
VALUES ('global', '0', '0')
ON CONFLICT ("id") DO NOTHING;
