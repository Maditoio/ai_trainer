import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import pg from "pg";
import { getDirectDatabaseUrl } from "./url";

const { Client } = pg;

export async function withAdminClient<T>(
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    connectionString: getDirectDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** Wipes all tables/types in public (including legacy schemas and drizzle metadata). */
export async function wipePublicSchema(client: pg.Client) {
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query("GRANT ALL ON SCHEMA public TO PUBLIC");
  await client.query("GRANT ALL ON SCHEMA public TO CURRENT_USER");
}

export function loadMigrationStatements(
  migrationsDir = "drizzle",
  fileFilter?: (name: string) => boolean,
): string[] {
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => (fileFilter ? fileFilter(f) : true))
    .sort();

  const statements: string[] = [];
  for (const file of files) {
    const raw = readFileSync(join(migrationsDir, file), "utf8");
    const parts = raw
      .split(/--> statement-breakpoint\n?/)
      .map((s) => s.trim())
      .filter(Boolean);
    statements.push(...parts);
  }
  return statements;
}

export async function applySqlMigrations(
  client: pg.Client,
  fileFilter?: (name: string) => boolean,
) {
  const statements = loadMigrationStatements("drizzle", fileFilter);
  for (const statement of statements) {
    await client.query(statement);
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  await client.query(`DELETE FROM "__drizzle_migrations"`);
  await client.query(
    `INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES ($1, $2)`,
    ["0000_init", Date.now()],
  );
}
