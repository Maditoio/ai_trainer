/**
 * Applies drizzle/*.sql using node-pg (reliable after db:reset).
 * Prefer this over `drizzle-kit migrate` when the public schema was wiped.
 */
import { config } from "dotenv";
import { applySqlMigrations, withAdminClient } from "../lib/db/admin-client";

config({ path: ".env.local" });
config();

async function migrate() {
  const { getDatabaseUrl } = await import("../lib/db/url");
  getDatabaseUrl();

  await withAdminClient(async (client) => {
    const { rows } = await client.query<{ regclass: string | null }>(
      `SELECT to_regclass('public.tiers') AS regclass`,
    );
    const { rows: cryptoRows } = await client.query<{ regclass: string | null }>(
      `SELECT to_regclass('public.crypto_deposits') AS regclass`,
    );
    const { rows: referralRows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'referral_code'
      ) AS exists`,
    );
    const { rows: commissionRows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'referral_commission_paid_at'
      ) AS exists`,
    );
    const { rows: withdrawalSettingsRows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'withdrawal_fee_percent'
      ) AS exists`,
    );
    const { rows: platformSettingsRows } = await client.query<{
      regclass: string | null;
    }>(`SELECT to_regclass('public.platform_settings') AS regclass`);
    const { rows: phoneRows } = await client.query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'phone_number'
      ) AS exists`,
    );
    const { rows: submissionUniqueIndexRows } = await client.query<{
      exists: boolean;
    }>(
      `SELECT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'submissions'
          AND indexname = 'submissions_user_question_idx'
      ) AS exists`,
    );
    const { rows: trainingWrongRewardRows } = await client.query<{
      exists: boolean;
    }>(
      `SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'platform_settings'
          AND column_name = 'wrong_answer_reward_percent'
      ) AS exists`,
    );

    if (!rows[0]?.regclass) {
      console.log("Applying all migrations from drizzle/*.sql …");
      await applySqlMigrations(client);
      return;
    }

    if (!cryptoRows[0]?.regclass) {
      console.log("Applying drizzle/0001_crypto_withdrawals.sql …");
      await applySqlMigrations(client, (f) => f.includes("0001"));
    }

    if (!referralRows[0]?.exists) {
      console.log("Applying drizzle/0002_categories_referrals.sql …");
      await applySqlMigrations(client, (f) => f.includes("0002"));
    }

    if (!commissionRows[0]?.exists) {
      console.log("Applying drizzle/0003_referral_upgrade_commission.sql …");
      await applySqlMigrations(client, (f) => f.includes("0003"));
    }

    if (!withdrawalSettingsRows[0]?.exists) {
      console.log("Applying drizzle/0004_user_withdrawal_settings.sql …");
      await applySqlMigrations(client, (f) => f.includes("0004"));
    }

    if (!platformSettingsRows[0]?.regclass) {
      console.log("Applying drizzle/0005_global_withdrawal_settings.sql …");
      await applySqlMigrations(client, (f) => f.includes("0005"));
    }

    if (!phoneRows[0]?.exists || submissionUniqueIndexRows[0]?.exists) {
      console.log("Applying drizzle/0006_weekly_paid_task_repeats.sql …");
      await applySqlMigrations(client, (f) => f.includes("0006"));
    }

    if (!trainingWrongRewardRows[0]?.exists) {
      console.log("Applying drizzle/0007_free_training_wrong_reward.sql …");
      await applySqlMigrations(client, (f) => f.includes("0007"));
      return;
    }

    console.log("Schema up to date.");
  });

  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
