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

  // 3. Drop deprecated unused tables (license_history, notifications, families, debts, budgets, etc.)
  await sql`DROP TABLE IF EXISTS license_history CASCADE;`;
  await sql`DROP TABLE IF EXISTS notifications CASCADE;`;
  await sql`DROP TABLE IF EXISTS debts CASCADE;`;
  await sql`DROP TABLE IF EXISTS budgets CASCADE;`;
  await sql`DROP TABLE IF EXISTS family_members CASCADE;`;
  await sql`DROP TABLE IF EXISTS families CASCADE;`;
  await sql`DROP TABLE IF EXISTS auth_otp_codes CASCADE;`;
  console.log("✅ Deprecated tables (license_history, notifications, debts, budgets, family_members, families, auth_otp_codes) dropped if existed");

  // 4. Drop deprecated foreign key columns in remaining tables and drop currency from accounts
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS active_family_id CASCADE;`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS telegram_id CASCADE;`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS telegram_username CASCADE;`;
  await sql`ALTER TABLE users DROP COLUMN IF EXISTS expired_at CASCADE;`;
  await sql`ALTER TABLE accounts DROP COLUMN IF EXISTS family_id CASCADE;`;
  await sql`ALTER TABLE accounts DROP COLUMN IF EXISTS currency CASCADE;`;
  await sql`ALTER TABLE categories DROP COLUMN IF EXISTS family_id CASCADE;`;
  await sql`ALTER TABLE transactions DROP COLUMN IF EXISTS family_id CASCADE;`;
  await sql`ALTER TABLE transactions DROP COLUMN IF EXISTS budget_id CASCADE;`;
  await sql`ALTER TABLE transactions DROP COLUMN IF EXISTS source CASCADE;`;
  console.log("✅ Deprecated columns (currency, family_id, budget_id, active_family_id, source, telegram_id, telegram_username, expired_at) removed");

  // 4b. Ensure user_settings table exists
  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      transaction_count text DEFAULT '0' NOT NULL,
      currency text DEFAULT 'IDR' NOT NULL,
      email_notifications boolean DEFAULT false NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      updated_at timestamp with time zone DEFAULT now() NOT NULL
    );
  `;
  console.log("✅ Table user_settings ready");

  // 5. Update transactions type check constraint and drop amount check constraint
  await sql`
    ALTER TABLE transactions 
    DROP CONSTRAINT IF EXISTS transactions_source_check,
    DROP CONSTRAINT IF EXISTS transactions_amount_check,
    DROP CONSTRAINT IF EXISTS transactions_type_check;
  `;
  await sql`
    ALTER TABLE transactions 
    ADD CONSTRAINT transactions_type_check 
    CHECK (type IN ('income', 'expense', 'transfer'));
  `;
  console.log("✅ Constraint type ('income', 'expense', 'transfer') updated and old amount/source checks removed");

  // 6. Alter balance and amount columns to text for Zero-Knowledge Encryption
  await sql`ALTER TABLE accounts ALTER COLUMN balance TYPE text;`;
  await sql`ALTER TABLE transactions ALTER COLUMN amount TYPE text;`;
  console.log("✅ Accounts balance and transactions amount columns migrated to text for Zero-Knowledge encryption");

  // 7. Add to_account_id to transactions if not exists and allow null category_id (for transfer)
  await sql`
    ALTER TABLE transactions 
    ADD COLUMN IF NOT EXISTS to_account_id uuid REFERENCES accounts(id) ON DELETE RESTRICT,
    ALTER COLUMN category_id DROP NOT NULL;
  `;

  // 8. Ensure default categories exist
  const existingCats = await sql`SELECT count(*) FROM categories WHERE is_default = true;`;
  if (parseInt(existingCats[0].count) === 0) {
    const defaultCats = [
      { name: "Gaji & Pendapatan", type: "income", icon: "💼", is_default: true },
      { name: "Bonus & Freelance", type: "income", icon: "✨", is_default: true },
      { name: "Investasi / Bunga", type: "income", icon: "📈", is_default: true },
      { name: "Makanan & Minuman", type: "expense", icon: "🍜", is_default: true },
      { name: "Transportasi", type: "expense", icon: "🛵", is_default: true },
      { name: "Kebutuhan Rumah", type: "expense", icon: "🛒", is_default: true },
      { name: "Langganan & Utilitas", type: "expense", icon: "⚡", is_default: true },
      { name: "Hiburan & Rekreasi", type: "expense", icon: "🍿", is_default: true },
      { name: "Kesehatan", type: "expense", icon: "💊", is_default: true },
    ];
    for (const cat of defaultCats) {
      await sql`
        INSERT INTO categories (name, type, icon, is_default)
        VALUES (${cat.name}, ${cat.type}, ${cat.icon}, ${cat.is_default});
      `;
    }
    console.log("✅ Default categories seeded");
  }

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
