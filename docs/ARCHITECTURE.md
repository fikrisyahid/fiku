# Fiku System Architecture

This document provides a high-level architectural overview of the **Fiku Zero-Knowledge Personal Finance Platform**.

---

## 🏗️ System Components

Fiku is built as a modern **Next.js (App Router)** web-first application designed for straightforward deployment on Vercel / serverless environments backed by PostgreSQL (Supabase) and end-to-end Zero-Knowledge encryption:

```
[ User (Web & Mobile Browser) ]
               │
               ▼
   [ Next.js 16 Web Application ]
   ├── / (Landing Page & Live Interactive Sandbox Preview)
   ├── /login (Email & Password Auth)
   ├── /transaction (Live Spreadsheet, Server-side Pagination, Smart Input, /saldo, /kantong, /kategori)
   ├── /summary (Daily/Weekly/Monthly/Yearly Filters, Metrics, Cash Flow Chart)
   └── /settings (Currency Selection, User Preferences)
               │
               ▼
    [ Server Actions & Lib Layer ]
    ├── app/actions/auth.ts (Authentication, Key Derivation, Session Cookie)
    ├── app/actions/transactions.ts (Spreadsheet Live-Sync, Transfer, Server-side Pagination, Counter Cache)
    ├── app/actions/accounts.ts & categories.ts
    ├── app/actions/settings.ts (User Settings & Currency Configuration)
    ├── lib/smart-input.ts (Natural Language Transaction Parser - Bilingual ID & EN)
    └── lib/crypto.ts (Zero-Knowledge RAM Session Vault, X25519 Ephemeral ECDH + AES-256-GCM)
               │
               ▼
     [ PostgreSQL Database Layer ]
     └── Drizzle ORM Schema (Supabase Session Pooler)
         ├── users (Profile & Public Key)
         ├── sessions (Session Tokens)
         ├── accounts (Encrypted Balances)
         ├── categories (Categories)
         ├── transactions (Encrypted Amounts & Notes)
         └── user_settings (Currency, Transaction Counter Cache, Preferences)
```

1. **Next.js 16 Web App** (`main/app`):
   - **Authentication**: Email and password (bcrypt hashing) with secure 30-day session cookies (`fana_session`).
   - **Transaction Page (`/transaction`)**:
     - *Live Interactive Spreadsheet*: Edit transaction dates, types, categories, accounts/wallets, amounts (dynamic thousand-separated formatting), and notes with debounced auto-save (700ms).
     - *Server-side Pagination & Filtering*: Server-paginated records with sorting, search filtering, and custom page size limits.
     - *Inter-Wallet Transfers*: Move funds between wallets without creating artificial duplicate income/expense entries or corrupting total balances.
     - *Bilingual Smart Input*: Rapid single-line natural language recording in both Indonesian and English (e.g. `-25k grilled chicken cash`, `+5m salary bca`, `tf 100k bca to gopay`).
     - *Quick Action Modals*: Direct shortcuts for `/saldo`, `/kantong`, and `/kategori`.
     - *Excel Import & Export*: Export `.xlsx` files based on custom date ranges or bulk import historical data using standard spreadsheets.
   - **Summary Page (`/summary`)**:
     - Timeframe filters: Daily, Weekly, Monthly, Yearly.
     - Metrics for accumulated balance, total income, expenses, and net surplus/deficit.
     - *Cash Flow Trend Charts*: Responsive visualization of incoming and outgoing funds.
     - Category-based expenditure allocations and per-wallet balance distributions.
   - **Settings Page (`/settings`)**:
     - Allows users to select their preferred active currency (IDR, USD, EUR, SGD, JPY, GBP, AUD, CNY, MYR) and manage preferences.
   - **Interactive Sandbox on Homepage (`/`)**:
     - Visitors can test drive the live spreadsheet and interactive financial charts without signing up.

2. **Logic & Natural Language Parsing Layer** (`main/lib/`):
   - `lib/smart-input.ts`: Parses bilingual natural transaction phrasing in Indonesian and English into structured transactions.

3. **Data Layer (PostgreSQL + Drizzle ORM)** (`main/db/`):
   - Direct and pooled connection to PostgreSQL (Supabase) via Drizzle ORM.
   - Account balances (`accounts.balance`), transaction amounts (`transactions.amount`), and notes (`transactions.note`) are stored encrypted using ciphertext strings formatted as `enc:v1:...`.
   - `user_settings` maintains denormalized transaction counters and user preferences.

---

## 🔐 Security Model & Zero-Knowledge Architecture

1. **Password Hashing**: Bcrypt with 10 salt rounds.
2. **Asymmetric Key Pairs**: Each user has a unique X25519 (Curve25519) key pair. The public key is stored in the database to encrypt incoming data.
3. **Double Protection of Private Keys**: The user's private key is encrypted with a combination of the user's password, a per-user salt, a server pepper, and a master application secret key (`APP_SECRET_KEY`).
4. **Stateless Sealed Cookie Vault**: The active session decryption key is sealed with AES-256-GCM using the server's master secret key (`APP_SECRET_KEY`) and stored in an HTTP-only secure cookie (`fana_key_vault`). This provides seamless serverless resilience across cold starts and lambda instances while ensuring plaintext private keys and decrypted financial values are never written to disk or the database.
