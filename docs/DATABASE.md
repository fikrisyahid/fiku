# Skema Database & Model Data (Zero-Knowledge)

Fiku menggunakan **PostgreSQL** (Supabase) yang dikelola melalui **Drizzle ORM** (`main/db/schema.ts`). Seluruh nilai finansial sensitif disimpan dalam bentuk terenkripsi asimetris (**Zero-Knowledge Encryption**).

---

## 🔐 Zero-Knowledge Financial Data Architecture

Pada Fiku, saldo dompet, nominal transaksi, dan catatan transaksi dienkripsi menggunakan public key pengguna (`X25519` + `AES-256-GCM`). Kolom-kolom ini bertipe `text` dengan payload berformat:
`enc:v1:<ephemeral_pub_key>:<iv>:<auth_tag>:<ciphertext>`

Database admin atau siapapun yang membaca data PostgreSQL secara langsung tidak dapat membaca angka saldo maupun catatan pengguna.

---

## 🗄️ Tabel Utama

### 1. `users`
Menyimpan profil pengguna dan kunci kriptografi asimetris.
- `id`: UUID (Primary Key, default `gen_random_uuid()`).
- `email`: Text (Unique, Not Null).
- `fullName`: Text (Not Null).
- `phone`: Text (Nullable).
- `passwordHash`: Text (Bcrypt password hash).
- `pinHash`, `pinSalt`: Text (Salt per pengguna untuk derivasi kunci PBKDF2).
- `publicKey`: Text (X25519 public key dalam format PEM).
- `encryptedPrivateKey`: Text (Private key yang dienkripsi menggunakan Password + Salt + Server Secret).
- `createdAt`, `updatedAt`: Timestamp with timezone.

### 2. `sessions`
Menyimpan sesi login web berbasis token acak 64 karakter hex.
- `id`: Text (Session token, Primary Key).
- `userId`: UUID (Foreign Key -> `users.id`, onDelete cascade).
- `expiresAt`: Timestamp with timezone (Masa berlaku sesi 30 hari).
- `createdAt`: Timestamp with timezone.

### 3. `accounts`
Kantong keuangan, rekening bank, e-wallet, atau uang tunai.
- `id`: UUID (Primary Key).
- `userId`: UUID (Foreign Key -> `users.id`, onDelete cascade).
- `name`: Text (e.g. "Cash (Dompet Tunai)", "Rekening Bank", "e-Wallet (GoPay/OVO)").
- `type`: Text (`bank` | `ewallet` | `cash`).
- `balance`: Text (Ciphertext terenkripsi Zero-Knowledge, default `"0"`).
- `currency`: Text (default `"IDR"`).
- `isDefault`: Boolean.
- `createdAt`, `updatedAt`: Timestamp with timezone.

### 4. `categories`
Kategori transaksi pemasukan dan pengeluaran.
- `id`: UUID (Primary Key).
- `userId`: UUID (Nullable, jika `null` berarti kategori default sistem).
- `name`: Text (e.g. "Makanan & Minuman", "Gaji & Pendapatan").
- `type`: Text (`income` | `expense`).
- `icon`: Text (Emoji / icon identifier).
- `isDefault`: Boolean.
- `createdAt`, `updatedAt`: Timestamp with timezone.

### 5. `transactions`
Catatan transaksi keuangan harian maupun transfer antar kantong.
- `id`: UUID (Primary Key).
- `userId`: UUID (Foreign Key -> `users.id`, onDelete cascade).
- `accountId`: UUID (Foreign Key -> `accounts.id`, kantong sumber).
- `toAccountId`: UUID (Nullable, Foreign Key -> `accounts.id`, kantong tujuan transfer).
- `categoryId`: UUID (Nullable, Foreign Key -> `categories.id`).
- `amount`: Text (Ciphertext terenkripsi Zero-Knowledge).
- `type`: Text (`income` | `expense` | `transfer`).
- `note`: Text (Nullable, ciphertext terenkripsi Zero-Knowledge).
- `transactionDate`: Date string (`YYYY-MM-DD`).
- `createdAt`, `updatedAt`: Timestamp with timezone.

---

## ⚙️ Perintah Database

Jalankan perintah ini dari root atau folder `main/`:

```bash
bun run db:sync       # Sinkronisasi skema & tipe kolom ke PostgreSQL Supabase
bun run db:reset      # Mengosongkan seluruh data tabel database
bun run db:push       # Push schema Drizzle langsung ke PostgreSQL
bun run db:studio     # Membuka antarmuka Drizzle Studio di browser
```
