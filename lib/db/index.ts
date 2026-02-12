import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Missing required env var: DATABASE_URL");
}

type PostgresClient = ReturnType<typeof postgres>;
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __thikr_pg?: PostgresClient;
  __thikr_db?: DrizzleDb;
};

const client =
  globalForDb.__thikr_pg ?? postgres(connectionString, { prepare: false });

export const db = globalForDb.__thikr_db ?? drizzle(client, { schema });

// In dev, Next hot reload can cause module re-evaluation; keep a singleton client/DB.
if (process.env.NODE_ENV !== "production") {
  globalForDb.__thikr_pg = client;
  globalForDb.__thikr_db = db;
}
