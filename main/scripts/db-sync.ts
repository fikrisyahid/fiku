import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

async function main() {
  console.log("🔄 Synchronizing and updating database schema in Postgres/Supabase...");

  // 1. Ensure users table columns
  await sql`
    ALTER TABLE users 
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN expired_at DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE,
    ADD COLUMN IF NOT EXISTS telegram_username text,
    ADD COLUMN IF NOT EXISTS password_hash text,
    ADD COLUMN IF NOT EXISTS pin_hash text,
    ADD COLUMN IF NOT EXISTS pin_salt text,
    ADD COLUMN IF NOT EXISTS public_key text,
    ADD COLUMN IF NOT EXISTS encrypted_private_key text;
  `;
  console.log("✅ Users table columns verified");

  // 2. Ensure sessions table exists
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("✅ Table sessions ready");

  // 3. Drop deprecated unused tables (families, debts, budgets, etc.)
  await sql`DROP TABLE IF EXISTS debts CASCADE;`;
  await sql`DROP TABLE IF EXISTS budgets CASCADE;`;
  await sql`DROP TABLE IF EXISTS family_members CASCADE;`;
  await sql`DROP TABLE IF EXISTS families CASCADE;`;
  await sql`DROP TABLE IF EXISTS auth_otp_codes CASCADE;`;
  console.log("✅ Deprecated tables (debts, budgets, family_members, families, auth_otp_codes) dropped if existed");

  // 4. Drop deprecated foreign key columns in remaining tables
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS active_family_id CASCADE;`;
  await sql`ALTER TABLE accounts DROP COLUMN IF EXISTS family_id CASCADE;`;
  await sql`ALTER TABLE categories DROP COLUMN IF EXISTS family_id CASCADE;`;
  await sql`ALTER TABLE transactions DROP COLUMN IF EXISTS family_id CASCADE;`;
  await sql`ALTER TABLE transactions DROP COLUMN IF EXISTS budget_id CASCADE;`;
  console.log("✅ Deprecated columns (family_id, budget_id, active_family_id) removed");

  // 5. Update transactions source check constraint
  await sql`
    ALTER TABLE transactions 
    DROP CONSTRAINT IF EXISTS transactions_source_check;
  `;
  await sql`
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_source_check 
    CHECK (source IN ('web', 'whatsapp', 'telegram'));
  `;
  console.log("✅ Constraint source in transactions updated");

  // 6. Add to_account_id to transactions if not exists
  await sql`
    ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS to_account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT;
  `;

  // 7. Trigger protection preventing default categories (is_default = true) from being deleted
  await sql`
    CREATE OR REPLACE FUNCTION prevent_delete_default_category()
    RETURNS TRIGGER AS $$
    BEGIN
      IF OLD.is_default = true THEN
        RAISE EXCEPTION 'Default categories cannot be deleted!';
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
  console.log("✅ Default category protection trigger activated");

  console.log("🎉 Database schema synchronization completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Schema synchronization failed:", err);
  process.exit(1);
});
