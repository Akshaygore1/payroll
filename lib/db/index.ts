import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

declare global {
  var __db__: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to Supabase Postgres");
  }

  return databaseUrl;
}

export function getDb() {
  if (!globalThis.__db__) {
    const client = postgres(getDatabaseUrl(), { prepare: false });
    globalThis.__db__ = drizzle(client, { schema });
  }

  return globalThis.__db__;
}

export type Db = ReturnType<typeof getDb>;
