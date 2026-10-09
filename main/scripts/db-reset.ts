import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

async function main() {
  console.log("⚠️ Mengosongkan seluruh tabel database di PostgreSQL/Supabase...");

  // Drop atau Truncate semua tabel data aplikasi
  // Urutan truncate dengan CASCADE agar foreign key tidak menghalangi
  await sql`
    TRUNCATE TABLE 
      sessions, 
      transactions, 
      accounts, 
      users,
      categories
    CASCADE;
  `;

  console.log("✅ Berhasil mengosongkan tabel (sessions, transactions, accounts, users, categories)!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Gagal mengosongkan database:", err);
  process.exit(1);
});
