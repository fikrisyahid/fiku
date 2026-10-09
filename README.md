# Fiku - Personal & Family Finance Management

Fiku is a multi-platform personal and family finance management system powered by **Next.js 16**, **TypeScript**, and **Telegram Bot** (GrammY). All financial data is synchronized in real time and cryptographically secured.

---

## 📁 Repository Structure

```text
fiku/
├── main/              # Core application source code (Next.js, Telegram Bot, DB, API)
│   ├── app/           # Next.js App Router (Dashboard web, Server Actions, Webhook API)
│   ├── components/    # UI components (Tailwind v4, Shadcn)
│   ├── db/            # Drizzle ORM schema definitions (PostgreSQL)
│   ├── drizzle/       # Database migration snapshots
│   ├── lib/           # Business logic, cryptography, GrammY Telegram bot & command handlers
│   ├── public/        # Static assets
│   ├── scripts/       # Automation scripts (webhook setup, dev polling bot, db-sync)
│   └── package.json   # Next.js & Bun dependencies
├── docs/              # Comprehensive technical documentation
│   ├── ARCHITECTURE.md
│   ├── TELEGRAM_BOT.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
├── ops/               # Operations, CI/CD, and Cloudflare configuration
│   ├── workflow.py    # Python/uv task runner and .env synchronization helper
│   ├── pyproject.toml # Python dependencies definition for workflow runner
│   ├── wrangler.toml  # Cloudflare Workers configuration
│   └── ci-cd.yml      # CI/CD pipeline template
├── COMMANDS.md        # Reference guide for package.json root commands
├── package.json       # Root task runner forwarding commands to ops/workflow.py
├── .gitignore         # Root git ignore rules
└── .env.example       # Root environment variable template
```

---

## 🚀 Key Features

1. **Multi-Mode Finance**:
   - **Personal Mode**: Isolated finance tracking for individuals.
   - **Family Mode**: Collaborative financial management with Admin and Member roles.
2. **Dual-Platform Synchronization**:
   - **Telegram Bot**: Natural language transaction input (`-25k iced latte`), instant balance checks (`/saldo`), inter-wallet transfers (`/tf`), budget allocations (`/alokasi`), and debt tracking (`/utang`).
   - **Web Dashboard**: Visual financial overview displaying total balances, wallet distributions, and real-time transaction feeds.
3. **Security & Cryptography**:
   - Zero-Knowledge in-memory RAM session vault.
   - PBKDF2 key derivation (PIN + Salt + Pepper) and AES-256-GCM encryption.
   - Per-user X25519 (Curve25519) keypairs.
4. **Cloud-Ready Architecture**:
   - Ready for serverless deployment on Cloudflare Workers and standard container environments.

---

## 🛠️ Local Development

All commands can be executed directly from the **repository root** using `bun run`. Environment variables are automatically kept in sync between root `.env` and `main/.env`.

### Prerequisites:
- [Bun](https://bun.sh/) (`bun >= 1.4`)
- [uv](https://docs.astral.sh/uv/) (Python package & project manager)

### Quick Start:

```bash
# 1. Setup environment variables at the root
cp .env.example .env
# Edit .env at the root (automatically synced to main/.env upon running commands)

# 2. Install application dependencies
bun run install:main

# 3. Start Web Dashboard
bun run dev

# 4. Start Telegram Bot (polling mode for local development)
bun run bot:dev
```

### Essential Root Commands:

| Command | Action |
| :--- | :--- |
| `bun run dev` | Launch Next.js Web Dashboard on port 3000 |
| `bun run bot:dev` | Launch Telegram Bot in local long-polling mode |
| `bun run check` | Run TypeScript type checks (`tsc --noEmit`) |
| `bun run lint` | Run ESLint checks |
| `bun run build` | Build Next.js application for production |
| `bun run sync:env` | Manually synchronize root `.env` with `main/.env` |
| `bun run db:push` | Push Drizzle schema to PostgreSQL |
| `bun run db:studio` | Launch Drizzle Studio database viewer |

For complete documentation on all commands, see [COMMANDS.md](file:///D:/Dev/fana/docs/COMMANDS.md). For architecture and deployment details, explore the [`docs/`](file:///D:/Dev/fana/docs) directory.
