import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!connectionString && process.env.NODE_ENV === "production" && !isProductionBuild) {
  throw new Error("DATABASE_URL is required in production");
}

const client = postgres(
  connectionString ?? "postgresql://postgres:postgres@localhost:5432/invoicerush",
  {
    max: 10,
    idle_timeout: 20,
    prepare: false,
  },
);

export const db = drizzle(client, { schema });
export type Database = typeof db;
