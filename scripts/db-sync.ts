import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

async function main() {
  console.log("🔄 Sinkronisasi dan update skema tabel di Supabase...");

  // 1. Tambah telegram_id & telegram_username ke users serta pastikan default id gen_random_uuid() & expired_at nullable
  await sql`
    ALTER TABLE users 
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN expired_at DROP NOT NULL,
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
  // 5. Trigger proteksi agar kategori default (is_default = true) tidak bisa dihapus
  await sql`
    CREATE OR REPLACE FUNCTION prevent_delete_default_category()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.is_default = true THEN
        RAISE EXCEPTION 'Kategori default tidak dapat dihapus!';
      END IF;
      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;
  `;

  await sql`
    DROP TRIGGER IF EXISTS trg_prevent_delete_default_category ON categories;
  `;

  await sql`
    CREATE TRIGGER trg_prevent_delete_default_category
    BEFORE DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION prevent_delete_default_category();
  `;
  console.log("✅ Trigger perlindungan kategori default berhasil diaktifkan");

  console.log("🎉 Sinkronisasi skema database selesai!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal sync skema:", err);
  process.exit(1);
});
