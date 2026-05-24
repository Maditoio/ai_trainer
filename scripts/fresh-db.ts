/**
 * Full fresh start: wipe public schema → apply SQL migrations → seed.
 * Uses node-pg (TCP), not drizzle-kit — avoids Neon websocket / TTY issues.
 */
import { config } from "dotenv";
import { execSync } from "child_process";
import {
  applySqlMigrations,
  wipePublicSchema,
  withAdminClient,
} from "../lib/db/admin-client";

config({ path: ".env.local" });
config();

async function fresh() {
  console.log("1/3 Wiping public schema…");
  await withAdminClient(async (client) => {
    await wipePublicSchema(client);
  });

  console.log("2/3 Applying migrations from drizzle/*.sql…");
  await withAdminClient(async (client) => {
    await applySqlMigrations(client);
  });

  console.log("3/3 Seeding…");
  execSync("npx tsx scripts/seed.ts", {
    stdio: "inherit",
    env: process.env,
  });

  console.log("Done. Database is fresh and seeded.");
}

fresh().catch((e) => {
  console.error(e);
  process.exit(1);
});
