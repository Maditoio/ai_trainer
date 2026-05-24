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

    if (!rows[0]?.regclass) {
      console.log("Applying all migrations from drizzle/*.sql …");
      await applySqlMigrations(client);
      return;
    }

    if (!cryptoRows[0]?.regclass) {
      console.log("Applying drizzle/0001_crypto_withdrawals.sql …");
      await applySqlMigrations(client, (f) => f.includes("0001"));
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
