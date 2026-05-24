import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { getDatabaseUrl } from "./url";

type Database = NeonHttpDatabase<typeof schema>;

let instance: Database | undefined;

function getDb(): Database {
  if (!instance) {
    instance = drizzle(neon(getDatabaseUrl()), { schema });
  }
  return instance;
}

export const db = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
