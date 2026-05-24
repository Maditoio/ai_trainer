import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { getDirectDatabaseUrl } from "./lib/db/url";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: getDirectDatabaseUrl(),
  },
});
