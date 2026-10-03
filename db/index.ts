import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

// Menggunakan global singleton agar tidak membuka koneksi baru setiap kali hot-reload di Next.js dev
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

// `prepare: false` penting jika menggunakan Supabase Transaction Connection Pooler (port 6543)
const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
export * from "./schema";
