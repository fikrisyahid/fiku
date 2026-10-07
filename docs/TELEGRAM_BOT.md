# Telegram Bot Commands & Interactions

The Fana Telegram bot is built using the [GrammY](https://grammy.dev/) framework and supports two interaction modes: **Explicit Commands** and **Smart Natural Text Parsing**.

---

## 💡 Smart Natural Text Parsing

Users can record expenses and income naturally without typing the `/catat` command.

- Expenses:
  - `-25k kopi susu` -> Records an expense of Rp 25,000 under "Food & Drinks".
  - `-15000 bensin pertalite` -> Records an expense of Rp 15,000.
- Income:
  - `+5jt gaji bulanan` -> Records income of Rp 5,000,000.
  - `+50k bonus freelance` -> Records income of Rp 50,000.

---

## 📜 Bot Command Reference

### 1. Security & Account
- `/start` - Initialize the bot and trigger new user onboarding.
- `/help` - Interactive help menu with inline keyboards.
- `/set_pin <pin>` - Set a 6-digit numeric security PIN.
- `/buka <pin>` - Unlock the encrypted wallet session.
- `/kunci` - Lock the encryption session immediately.
- `/reset` - Wipe out all user data (requires two-step confirmation).

### 2. Wallets & Balances
- `/saldo` or `/dompet` - View all wallets and their current balances.
- `/dompet_utama <wallet_name>` - Set default wallet for transactions.
- `/tambah_dompet <name> [type] [initial_balance]` - Create a new wallet (`bank`, `ewallet`, `cash`).
- `/edit_dompet <old_name> <new_name>` - Rename an existing wallet.
- `/hapus_dompet <name>` - Delete a wallet.
- `/transfer <from> ke <to> <amount>` (alias: `/tf`) - Transfer funds between wallets.
- `/tarik <from_bank> <amount>` - Withdraw cash from a bank wallet into physical cash.

### 3. Transactions & Categories
- `/catat <type> <amount> <category> [note]` - Explicitly log a transaction (`masuk` / `keluar`).
- `/riwayat` - Display recent transaction history.
- `/kategori` - View all active categories.
- `/tambah_kategori <type> <name> [icon]` - Create a new category.
- `/edit_kategori <old_name> <new_name>` - Rename a category.
- `/hapus_kategori <name>` - Delete a category.

### 4. Budget Allocations
- `/alokasi` - View active budget allocations and remaining spending limits.
- `/tambah_alokasi <category> <limit> [start_date] [end_date]` - Set a budget limit.

### 5. Debts & Receivables
- `/utang` - View payables (debts you owe) and receivables (debts owed to you).
- `/tambah_utang <type> <person> <amount> [due_date] [note]` - Create a debt/receivable entry.
- `/lunas <debt_id>` - Mark a debt or receivable as fully settled.

### 6. Family Mode
- `/keluarga` - View family group status, members, and shared balance.
- `/buat_keluarga <name>` - Create a new family group (creator becomes admin).
- `/undang_keluarga <username/telegram_id>` - Invite a member to the family group.
- `/mode` - Switch active mode (`personal` <-> `family`).
