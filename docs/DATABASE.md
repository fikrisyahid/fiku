# Database Schema & Data Models

Fana menggunakan **PostgreSQL** yang dikelola melalui **Drizzle ORM** (`main/db/schema.ts`).

---

## 🗄️ Tabel-Tabel Utama

### 1. `users`
Menyimpan data identitas pengguna, autentikasi, dan pengaturan mode.
- `id`: UUID (Primary Key).
- `email`: Text (Unique, Not Null).
- `fullName`: Text (Not Null).
- `telegramId`: Text (Unique, nullable).
- `telegramUsername`: Text (Nullable).
- `activeMode`: Text (`personal` | `family`).
- `activeFamilyId`: UUID (Foreign Key -> `families.id`).
- `pinHash`, `pinSalt`: Text (Keamanan autentikasi PIN).
- `publicKey`, `encryptedPrivateKey`: Text (Kunci kriptografi akun).

### 2. `families` & `family_members`
Mendukung kolaborasi pencatatan keuangan keluarga.
- `families`: `id`, `name`, `adminUserId`.
- `family_members`: `id`, `familyId`, `userId`, `role` (`admin` | `member`), `status` (`pending` | `accepted` | `declined`), `invitedBy`.

### 3. `accounts`
Rekening bank, dompet digital, atau uang tunai (cash).
- `id`: UUID.
- `userId`: UUID (Owner).
- `familyId`: UUID (Nullable, jika akun bersama).
- `name`: Text (contoh: "BCA", "GoPay", "Dompet Tunai").
- `type`: Text (`bank` | `ewallet` | `cash`).
- `balance`: Numeric(15, 2).
- `isDefault`: Boolean.

### 4. `categories`
Kategori pengelompokan transaksi.
- `id`: UUID.
- `name`: Text.
- `type`: Text (`income` | `expense`).
- `icon`: Text (Emoji atau identifier icon).
- `isDefault`: Boolean.

### 5. `budgets`
Plafon anggaran dengan rentang waktu.
- `id`: UUID.
- `categoryId`: UUID (Foreign Key).
- `amountLimit`: Numeric(15, 2).
- `periodStart`: Date.
- `periodEnd`: Date.

### 6. `transactions`
Log transaksi pemasukan dan pengeluaran.
- `id`: UUID.
- `accountId`: UUID (Foreign Key -> `accounts`).
- `categoryId`: UUID (Foreign Key -> `categories`).
- `budgetId`: UUID (Nullable).
- `amount`: Numeric(15, 2).
- `type`: Text (`income` | `expense`).
- `source`: Text (`web` | `telegram` | `whatsapp`).
- `transactionDate`: Date.

### 7. `debts`
Pencatatan utang dan piutang.
- `id`: UUID.
- `type`: Text (`payable` / utang | `receivable` / piutang).
- `personName`: Text.
- `amount`: Numeric(15, 2).
- `dueDate`: Date (Nullable).
- `isSettled`: Boolean.

---

## ⚙️ Perintah Drizzle Kit

Jalankan perintah berikut di direktori `main/`:

```bash
bun run db:generate   # Generate file migrasi SQL baru dari schema
bun run db:push       # Terapkan perubahan skema langsung ke database
bun run db:migrate    # Jalankan file migrasi terdaftar
bun run db:studio     # Buka visual browser Drizzle Studio
```
