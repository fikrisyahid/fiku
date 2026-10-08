# Skema Database & Model Data

Fana menggunakan **PostgreSQL** yang dikelola melalui **Drizzle ORM** (`main/db/schema.ts`).

---

## 🗄️ Tabel Utama

### 1. `users`
Menyimpan profil pengguna dan kredensial autentikasi.
- `id`: UUID (Primary Key).
- `email`: Text (Unique, Not Null).
- `passwordHash`: Text (Bcrypt password hash).
- `fullName`: Text (Not Null).
- `pinHash`, `pinSalt`: Text (Keamanan PIN sekunder / legacy).
- `publicKey`, `encryptedPrivateKey`: Text (Kunci enkripsi asimetris).

### 2. `sessions`
Menyimpan sesi login web.
- `id`: Text (Session token 64 hex characters, Primary Key).
- `userId`: UUID (Foreign Key -> `users.id`).
- `expiresAt`: Timestamp (Masa berlaku sesi).
- `createdAt`: Timestamp.

### 3. `accounts`
Kantong keuangan, rekening bank, e-wallet, atau uang tunai.
- `id`: UUID.
- `userId`: UUID (Pemilik).
- `name`: Text (e.g. "Dompet Tunai", "BCA", "GoPay").
- `type`: Text (`bank` | `ewallet` | `cash`).
- `balance`: Numeric(15, 2).
- `isDefault`: Boolean.

### 4. `categories`
Kategori transaksi pemasukan dan pengeluaran.
- `id`: UUID.
- `name`: Text.
- `type`: Text (`income` | `expense`).
- `icon`: Text (Emoji / identifier ikon).
- `isDefault`: Boolean.

### 5. `transactions`
Catatan transaksi keuangan harian maupun transfer antar kantong.
- `id`: UUID.
- `userId`: UUID (Pemilik transaksi).
- `accountId`: UUID (Foreign Key -> `accounts.id`, kantong sumber).
- `toAccountId`: UUID (Nullable, Foreign Key -> `accounts.id`, kantong tujuan transfer).
- `categoryId`: UUID (Nullable, Foreign Key -> `categories.id`).
- `amount`: Numeric(15, 2).
- `type`: Text (`income` | `expense` | `transfer`).
- `note`: Text (Keterangan transaksi).
- `source`: Text (`web`).
- `transactionDate`: Date.

---

## ⚙️ Perintah Drizzle ORM

Jalankan perintah ini dari folder `main/`:

```bash
bun run db:sync       # Sinkronisasi kolom terbaru langsung ke Supabase
bun run db:push       # Push schema langsung ke PostgreSQL
bun run db:generate   # Generate file migrasi SQL baru
bun run db:migrate    # Terapkan migrasi tertunda
bun run db:studio     # Buka antarmuka Drizzle Studio di browser
```
