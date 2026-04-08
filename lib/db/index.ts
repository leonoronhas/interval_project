import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// This client connects via DATABASE_URL using a direct Postgres role.
// Supabase Row-Level Security (RLS) policies defined in supabase/schema.sql
// are NOT enforced here — they only apply to queries made through the Supabase
// JS client (anon/service role). Data access security for this app is enforced
// by: (1) proxy.ts session redirects on pages, (2) auth.getUser() checks in API
// routes, and (3) the least-privilege database role on DATABASE_URL.
const globalForDb = global as unknown as { _pgClient: postgres.Sql };

const client =
  globalForDb._pgClient ?? postgres(process.env.DATABASE_URL!, { ssl: "require" });

if (process.env.NODE_ENV !== "production") {
  globalForDb._pgClient = client;
}

export const db = drizzle(client, { schema });
