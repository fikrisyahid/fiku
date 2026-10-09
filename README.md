<p align="center">
  <img src="main/public/brand/fiku-icon-512.png" alt="Fiku Logo" width="120" height="120" />
</p>

<h1 align="center">Fiku</h1>
<p align="center"><strong>Zero-Knowledge Personal Finance Platform</strong></p>
<p align="center">Catat Cepat, Kendalikan Keuangan Pribadi dengan Enkripsi End-to-End</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-Drizzle-336791?style=flat-square&logo=postgresql" alt="PostgreSQL Drizzle" />
  <img src="https://img.shields.io/badge/Security-Zero--Knowledge-059669?style=flat-square" alt="Zero-Knowledge" />
  <img src="https://img.shields.io/badge/License-MIT-amber?style=flat-square" alt="MIT License" />
</p>

Fiku is a modern web-based personal finance management platform built with **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, and **PostgreSQL (Drizzle ORM)**. All monetary amounts, wallet balances, and financial notes are secured using an end-to-end **Zero-Knowledge Encryption** architecture (ECIES Asymmetric Encryption with X25519 + AES-256-GCM).

---

## 📁 Repository Structure

```text
fana/
├── main/              # Main application source code (Next.js 16 Web App, Server Actions, DB, Crypto)
│   ├── app/           # Next.js App Router (/login, /transaction, /summary, /settings, /)
│   ├── components/    # UI components (Spreadsheet UI, Modals, Navbar, Charts)
│   ├── db/            # Drizzle ORM schema definitions (PostgreSQL)
│   ├── lib/           # Business logic, Zero-Knowledge cryptography, i18n, Smart Input
│   ├── public/        # Static assets, brand logos & icons
│   ├── scripts/       # Automation scripts (db-sync, db-reset, seed-dummy)
│   └── package.json   # Next.js & Bun dependencies
├── docs/              # Comprehensive technical documentation
│   ├── ARCHITECTURE.md # System architecture overview & Zero-Knowledge encryption flow
│   ├── DATABASE.md     # Database table schemas & data models
│   ├── DEPLOYMENT.md   # Deployment guide for Vercel & environment variables
│   ├── SMART_INPUT.md  # Quick entry syntax guide for Smart Input (ID & EN)
│   └── COMMANDS.md     # CLI commands and task runner reference
├── ops/               # Task runner & automatic synchronization
│   ├── workflow.py    # Python runner & .env sync between root <-> main/.env
│   └── pyproject.toml # Ops runner configuration
├── package.json       # Root task runner forwarding commands
├── .gitignore         # Git ignore rules
└── .env.example       # Environment variables template
```

---

## 🚀 Key Features

1. **Live Interactive Spreadsheet (`/transaction`)**:
   - Google Sheets-like spreadsheet experience running directly in the browser.
   - Instantly edit transaction date, type (income/expense/transfer), category, wallet/account, amount (dynamic thousand-separated formatting), and notes with debounced auto-save.
   - Automatic balance validation to prevent spending exceeding the available wallet balance.
   - Server-side pagination with sorting, search query filtering, and configurable page limits (10, 25, 50, 100).
   - Bulk Excel (`.xlsx`) transaction import & export.

2. **Bilingual Smart Natural Language Input**:
   - Lightning-fast entry in both Indonesian and English without multi-step forms.
   - Examples: `-25k grilled chicken bca`, `+5m monthly salary mandiri`, `tf 100k bca to gopay`, `-35k sayur cash`, `move 50k gopay to cash`.

3. **Zero-Knowledge Encryption**:
   - Wallet balances (`balance`), transaction amounts (`amount`), and notes (`note`) are encrypted client/server-side using the user's unique public key (`X25519`).
   - Stored in PostgreSQL as ciphertext payloads (`enc:v1:...`). Database administrators or unauthorized third parties cannot read users' monetary figures or financial descriptions.
   - Private keys are protected using a combination of the user's password + per-user salt + server pepper + master application secret key, and are only held in an in-memory RAM session vault for the duration of an active authenticated session.

4. **Realtime Visual Financial Summary (`/summary`)**:
   - Flexible time period filtering: Daily, Weekly, Monthly, and Yearly.
   - Accumulated balance metrics, total income, expenses, net surplus/deficit, cash flow trend charts, and category expense distribution breakdowns.

5. **User Settings & Multi-Currency (`/settings`)**:
   - Global currency configuration (IDR, USD, EUR, SGD, JPY, GBP, AUD, CNY, MYR) reflecting throughout the UI and reports.
   - Denormalized transaction count cache stored in `user_settings` to eliminate expensive full-table scans.

6. **Interactive Sandbox on the Homepage (`/`)**:
   - Prospective users can immediately try out the live spreadsheet and interactive summary directly on the landing page without signing up.

---

## 🛠️ Local Development

All commands can be run directly from the **repository root** using `bun run`. Environment variables are automatically synchronized between root `.env` and `main/.env`.

### Prerequisites:
- [Bun](https://bun.sh/) (`bun >= 1.4`)
- [uv](https://docs.astral.sh/uv/) (Python package runner for ops workflow runner)

### Quick Start Guide:

```bash
# 1. Setup environment variables at the root
cp .env.example .env
# Fill in DATABASE_URL, ENCRYPTION_PEPPER, and APP_SECRET_KEY in .env

# 2. Install dependencies
bun run install:main

# 3. Synchronize database schema to Supabase/PostgreSQL
bun run db:sync

# 4. (Optional) Generate demo user data encrypted with Zero-Knowledge
bun run seed:dummy

# 5. Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Key Commands:

| Command | Action |
| :--- | :--- |
| `bun run dev` | Runs the Next.js Web App on port 3000 |
| `bun run check` | Checks TypeScript types (`tsc --noEmit`) |
| `bun run lint` | Runs ESLint across the codebase |
| `bun run build` | Creates an optimized production build |
| `bun run db:sync` | Synchronizes database schema columns & constraints |
| `bun run db:reset` | Clears all data from database tables |
| `bun run db:studio` | Opens Drizzle Studio visual editor in browser |
| `bun run seed:dummy` | Generates a full demo account with dummy data |

For comprehensive documentation, see [docs/COMMANDS.md](file:///docs/COMMANDS.md) and [docs/ARCHITECTURE.md](file:///docs/ARCHITECTURE.md).
