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

  // 6. Buat tabel auth_otp_codes & sessions jika belum ada
  await sql`
    CREATE TABLE IF NOT EXISTS auth_otp_codes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code text NOT NULL,
      expires_at timestamp with time zone NOT NULL,
      used boolean DEFAULT false NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("✅ Tabel auth_otp_codes siap");

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("✅ Tabel sessions siap");

  // 7. Buat tabel families & family_members
  await sql`
    CREATE TABLE IF NOT EXISTS families (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("✅ Tabel families siap");

  await sql`
    CREATE TABLE IF NOT EXISTS family_members (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role text DEFAULT 'member' NOT NULL,
      status text DEFAULT 'pending' NOT NULL,
      invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL,
      UNIQUE(family_id, user_id)
    );
  `;
  console.log("✅ Tabel family_members siap");

  // 8. Tambah active_mode dan active_family_id ke users
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS active_mode text DEFAULT 'personal' NOT NULL,
    ADD COLUMN IF NOT EXISTS active_family_id uuid REFERENCES families(id) ON DELETE SET NULL;
  `;
  console.log("✅ Kolom active_mode & active_family_id siap di users");

  // 9. Tambah family_id ke accounts, categories, budgets, transactions, debts
  await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE debts ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  console.log("✅ Kolom family_id siap di accounts, categories, budgets, transactions, debts");

  console.log("🎉 Sinkronisasi skema database selesai!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal sync skema:", err);
  process.exit(1);
});
