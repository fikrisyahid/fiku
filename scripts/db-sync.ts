import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

async function main() {
  console.log("🔄 Sinkronisasi dan update skema tabel di Supabase...");

  // 1. Tambah telegram_id & telegram_username ke users
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE,
    ADD COLUMN IF NOT EXISTS telegram_username text;
  `;
  console.log("✅ Kolom telegram_id & telegram_username siap di users");

  // 2. Tambah name & notes ke budgets (alokasi dana dengan range waktu)
  await sql`
    ALTER TABLE budgets 
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS notes text;
  `;
  console.log("✅ Kolom name & notes siap di budgets");

  // 3. Update check constraint source di transactions agar mendukung 'telegram'
  await sql`
    ALTER TABLE transactions 
    DROP CONSTRAINT IF EXISTS transactions_source_check;
  `;
  await sql`
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_source_check 
    CHECK (source IN ('web', 'whatsapp', 'telegram'));
  `;
  console.log("✅ Constraint source di transactions diperbarui (web, whatsapp, telegram)");

  // 4. Tambah budget_id ke transactions
  await sql`
    ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL;
  `;
  console.log("✅ Kolom budget_id siap di transactions");

  console.log("🎉 Sinkronisasi skema database selesai!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal sync skema:", err);
  process.exit(1);
});
