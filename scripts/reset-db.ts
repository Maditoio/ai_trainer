/**
 * Wipes the entire public schema (all tables, including legacy ones).
 * Dev only — destroys all data in this database.
 */
import { config } from "dotenv";
import { wipePublicSchema, withAdminClient } from "../lib/db/admin-client";

config({ path: ".env.local" });
config();

async function reset() {
  await withAdminClient(async (client) => {
    await wipePublicSchema(client);
  });
  console.log("Public schema wiped (no tables left).");
  console.log("Next: npm run db:migrate   # create tables");
  console.log("Then: npm run db:seed      # insert tiers + admin");
  console.log("Or:   npm run db:fresh      # migrate + seed in one step");
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});
