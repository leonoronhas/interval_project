import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = global as unknown as { _pgClient: postgres.Sql };

const client =
  globalForDb._pgClient ??
  postgres(process.env.DATABASE_URL!, { ssl: "require" });

if (process.env.NODE_ENV !== "production") {
  globalForDb._pgClient = client;
}

export const db = drizzle(client, { schema });
