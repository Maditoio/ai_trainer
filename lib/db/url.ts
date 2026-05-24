/** Vercel Postgres exposes DATABASE_URL; Drizzle docs often use POSTGRES_URL. */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    throw new Error(
      "Database URL is not set. Add DATABASE_URL or POSTGRES_URL to your environment.",
    );
  }
  return url;
}

/** Non-pooler URL — preferred for schema changes and one-off admin scripts. */
export function getDirectDatabaseUrl(): string {
  const url = getDatabaseUrl();
  try {
    const parsed = new URL(url);
    parsed.hostname = parsed.hostname.replace("-pooler", "");
    return parsed.toString();
  } catch {
    return url.replace("-pooler", "");
  }
}
