import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

async function main() {
  console.log("🔄 Synchronizing and updating database schema in Postgres/Supabase...");

  // 1. Add telegram_id & telegram_username to users and ensure default id gen_random_uuid() & expired_at nullable
  await sql`
    ALTER TABLE users 
    ALTER COLUMN id SET DEFAULT gen_random_uuid(),
    ALTER COLUMN expired_at DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS telegram_id text UNIQUE,
    ADD COLUMN IF NOT EXISTS telegram_username text;
  `;
  console.log("✅ Column telegram_id & telegram_username ready in users");

  // 2. Add name & notes to budgets (allocation with date range)
  await sql`
    ALTER TABLE budgets 
    ADD COLUMN IF NOT EXISTS name text,
    ADD COLUMN IF NOT EXISTS notes text;
  `;
  console.log("✅ Column name & notes ready in budgets");

  // 3. Update transactions source check constraint to include 'telegram'
  await sql`
    ALTER TABLE transactions 
    DROP CONSTRAINT IF EXISTS transactions_source_check;
  `;
  await sql`
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_source_check 
    CHECK (source IN ('web', 'whatsapp', 'telegram'));
  `;
  console.log("✅ Constraint source in transactions updated (web, whatsapp, telegram)");

  // 4. Add budget_id and to_account_id to transactions
  await sql`
    ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES budgets(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS to_account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT;
  `;

  // 5. Trigger protection preventing default categories (is_default = true) from being deleted
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

  // 6. Create auth_otp_codes & sessions tables if not exists
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
  console.log("✅ Table auth_otp_codes ready");

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at timestamp with time zone NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("✅ Table sessions ready");

  // 7. Create families & family_members tables
  await sql`
    CREATE TABLE IF NOT EXISTS families (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      admin_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("✅ Table families ready");

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
  console.log("✅ Table family_members ready");

  // 8. Add active_mode and active_family_id to users
  await sql`
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS active_mode text DEFAULT 'personal' NOT NULL,
    ADD COLUMN IF NOT EXISTS active_family_id uuid REFERENCES families(id) ON DELETE SET NULL;
  `;
  console.log("✅ Columns active_mode & active_family_id ready in users");

  // 9. Add family_id to accounts, categories, budgets, transactions, debts
  await sql`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  await sql`ALTER TABLE debts ADD COLUMN IF NOT EXISTS family_id uuid REFERENCES families(id) ON DELETE CASCADE;`;
  console.log("✅ Column family_id ready in accounts, categories, budgets, transactions, debts");

  // 10. Add encryption & PIN columns to users
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash text,
    ADD COLUMN IF NOT EXISTS pin_hash text,
    ADD COLUMN IF NOT EXISTS pin_salt text,
    ADD COLUMN IF NOT EXISTS public_key text,
    ADD COLUMN IF NOT EXISTS encrypted_private_key text;
  `;
  console.log("✅ Columns password_hash, pin_hash, pin_salt, public_key, encrypted_private_key ready in users");

  console.log("🎉 Database schema synchronization completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Schema synchronization failed:", err);
  process.exit(1);
});
