import { applySqlMigrations, withAdminClient } from "./admin-client";

export async function ensureSchema() {
  await withAdminClient(async (client) => {
    const { rows } = await client.query<{ regclass: string | null }>(
      `SELECT to_regclass('public.tiers') AS regclass`,
    );
    if (rows[0]?.regclass) return;
    console.log("Tables missing — applying migrations first…");
    await applySqlMigrations(client);
  });
}
