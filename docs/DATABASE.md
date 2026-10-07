# Database Schema & Data Models

Fana uses **PostgreSQL** managed through **Drizzle ORM** (`main/db/schema.ts`).

---

## 🗄️ Primary Tables

### 1. `users`
Stores user profile information, authentication credentials, and active workspace modes.
- `id`: UUID (Primary Key).
- `email`: Text (Unique, Not Null).
- `fullName`: Text (Not Null).
- `telegramId`: Text (Unique, Nullable).
- `telegramUsername`: Text (Nullable).
- `activeMode`: Text (`personal` | `family`).
- `activeFamilyId`: UUID (Foreign Key -> `families.id`).
- `pinHash`, `pinSalt`: Text (PIN authentication security).
- `publicKey`, `encryptedPrivateKey`: Text (Cryptographic account keypair).

### 2. `families` & `family_members`
Supports collaborative financial management across family members.
- `families`: `id`, `name`, `adminUserId`.
- `family_members`: `id`, `familyId`, `userId`, `role` (`admin` | `member`), `status` (`pending` | `accepted` | `declined`), `invitedBy`.

### 3. `accounts`
Financial accounts, bank accounts, digital e-wallets, or cash wallets.
- `id`: UUID.
- `userId`: UUID (Owner).
- `familyId`: UUID (Nullable, when shared within a family).
- `name`: Text (e.g. "BCA", "GoPay", "Cash Wallet").
- `type`: Text (`bank` | `ewallet` | `cash`).
- `balance`: Numeric(15, 2).
- `isDefault`: Boolean.

### 4. `categories`
Categories for transaction grouping.
- `id`: UUID.
- `name`: Text.
- `type`: Text (`income` | `expense`).
- `icon`: Text (Emoji or icon identifier).
- `isDefault`: Boolean.

### 5. `budgets`
Spending limits with date range intervals.
- `id`: UUID.
- `categoryId`: UUID (Foreign Key).
- `amountLimit`: Numeric(15, 2).
- `periodStart`: Date.
- `periodEnd`: Date.

### 6. `transactions`
Log of income and expense transactions.
- `id`: UUID.
- `accountId`: UUID (Foreign Key -> `accounts`).
- `categoryId`: UUID (Foreign Key -> `categories`).
- `budgetId`: UUID (Nullable).
- `amount`: Numeric(15, 2).
- `type`: Text (`income` | `expense`).
- `source`: Text (`web` | `telegram` | `whatsapp`).
- `transactionDate`: Date.

### 7. `debts`
Payable and receivable debt tracking.
- `id`: UUID.
- `type`: Text (`payable` / debt I owe | `receivable` / money owed to me).
- `personName`: Text.
- `amount`: Numeric(15, 2).
- `dueDate`: Date (Nullable).
- `isSettled`: Boolean.

---

## ⚙️ Drizzle Kit Commands

Run these commands from the repository root via `bun run` or directly in `main/`:

```bash
bun run db:generate   # Generate new SQL migration files from schema
bun run db:push       # Push schema changes directly to PostgreSQL
bun run db:migrate    # Apply pending database migrations
bun run db:studio     # Open the Drizzle Studio visual web interface
```
