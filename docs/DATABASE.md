# Database Schema & Data Models (Zero-Knowledge)

Fiku uses **PostgreSQL** (Supabase) managed via **Drizzle ORM** ([`main/db/schema.ts`](file:///main/db/schema.ts)). All sensitive financial values are protected with asymmetric encryption (**Zero-Knowledge Encryption**).

---

## 🔐 Zero-Knowledge Financial Data Architecture

In Fiku, wallet balances, transaction amounts, and transaction notes are encrypted using the user's public key (`X25519` + `AES-256-GCM`). These columns use the `text` data type and store payloads formatted as:
`enc:v1:<ephemeral_pub_key>:<iv>:<auth_tag>:<ciphertext>`

Database administrators or any third party viewing the database cannot read raw balance numbers or user notes.

---

## 🗄️ Core Tables

### 1. `users`
Stores user profile information and asymmetric cryptographic key pairs.
- `id`: UUID (Primary Key, default `gen_random_uuid()`).
- `email`: Text (Unique, Not Null).
- `fullName`: Text (Not Null).
- `phone`: Text (Nullable).
- `passwordHash`: Text (Bcrypt password hash).
- `pinHash`, `pinSalt`: Text (Per-user salt for PBKDF2 key derivation).
- `publicKey`: Text (X25519 public key in PEM format).
- `encryptedPrivateKey`: Text (Private key encrypted using Password + Salt + Server Secret).
- `createdAt`, `updatedAt`: Timestamp with timezone.

### 2. `sessions`
Stores active web sessions using random 64-character hex tokens.
- `id`: Text (Session token, Primary Key).
- `userId`: UUID (Foreign Key -> `users.id`, onDelete cascade).
- `expiresAt`: Timestamp with timezone (Session duration 30 days).
- `createdAt`: Timestamp with timezone.

### 3. `accounts`
Financial wallets, bank accounts, e-wallets, or physical cash.
- `id`: UUID (Primary Key).
- `userId`: UUID (Foreign Key -> `users.id`, onDelete cascade).
- `name`: Text (e.g., "Cash", "Bank Account", "e-Wallet (GoPay/OVO)").
- `type`: Text (`bank` | `ewallet` | `cash`).
- `balance`: Text (Zero-Knowledge encrypted ciphertext, default `"0"`).
- `isDefault`: Boolean.
- `createdAt`, `updatedAt`: Timestamp with timezone.

### 4. `categories`
Income and expense transaction categories.
- `id`: UUID (Primary Key).
- `userId`: UUID (Nullable; if `null`, represents a system default category).
- `name`: Text (e.g., "Food & Beverage", "Salary & Income").
- `type`: Text (`income` | `expense`).
- `icon`: Text (Emoji / icon identifier).
- `isDefault`: Boolean.
- `createdAt`: Timestamp with timezone.

### 5. `transactions`
Daily income/expense transactions and inter-wallet transfers.
- `id`: UUID (Primary Key).
- `userId`: UUID (Foreign Key -> `users.id`, onDelete cascade).
- `accountId`: UUID (Foreign Key -> `accounts.id`, source wallet).
- `toAccountId`: UUID (Nullable, Foreign Key -> `accounts.id`, destination wallet for transfers).
- `categoryId`: UUID (Nullable, Foreign Key -> `categories.id`).
- `amount`: Text (Zero-Knowledge encrypted ciphertext).
- `type`: Text (`income` | `expense` | `transfer`).
- `note`: Text (Nullable, Zero-Knowledge encrypted ciphertext).
- `transactionDate`: Date string (`YYYY-MM-DD`).
- `createdAt`, `updatedAt`: Timestamp with timezone.

### 6. `user_settings`
Global user configuration and denormalized counter caches.
- `id`: UUID (Primary Key).
- `userId`: UUID (Unique Foreign Key -> `users.id`, onDelete cascade).
- `transactionCount`: Text (Counter cache representing total transactions, default `"0"`).
- `currency`: Text (User's preferred global currency code, e.g. `"IDR"`, `"USD"`, `"EUR"`, default `"IDR"`).
- `emailNotifications`: Boolean (Notification flag reserved for future email features, default `false`).
- `createdAt`, `updatedAt`: Timestamp with timezone.

---

## ⚙️ Database Commands

Run these commands from the project root or the `main/` directory:

```bash
bun run db:sync       # Synchronizes schema and column types to PostgreSQL Supabase
bun run db:reset      # Resets and clears all rows across database tables
bun run db:studio     # Opens the visual Drizzle Studio web interface
```
