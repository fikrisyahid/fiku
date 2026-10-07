# CLI & Package.json Commands Reference

This document explains all commands available in [`package.json`](file:///D:/Dev/fana/package.json) at the repository root. Each command delegates to [`ops/workflow.py`](file:///D:/Dev/fana/ops/workflow.py) via `uv run`, automatically guaranteeing environment variable synchronization between root `.env` and `main/.env`.

---

## 📋 Available Commands

### Development & Servers

| Command | Underlying Action | Description |
| :--- | :--- | :--- |
| `bun run dev` | `uv run ops/workflow.py dev` | Starts Next.js development server on port 3000. |
| `bun run bot:dev` | `uv run ops/workflow.py bot` | Runs the Telegram bot in local polling mode via `scripts/dev-bot.ts`. |
| `bun run bot` | `uv run ops/workflow.py bot` | Shorthand alias for `bun run bot:dev`. |
| `bun run start` | `uv run ops/workflow.py start` | Starts Next.js production server. |

### Quality & Verification

| Command | Underlying Action | Description |
| :--- | :--- | :--- |
| `bun run check` | `uv run ops/workflow.py check` | Runs TypeScript compiler checks without emitting code (`tsc --noEmit`). |
| `bun run lint` | `uv run ops/workflow.py lint` | Runs ESLint across the codebase. |
| `bun run build` | `uv run ops/workflow.py build` | Creates an optimized production build of the Next.js application. |

### Environment & Package Management

| Command | Underlying Action | Description |
| :--- | :--- | :--- |
| `bun run sync:env` | `uv run ops/workflow.py sync-env` | Manually syncs root `.env` and `main/.env` (prioritizing newer root edits). |
| `bun run install:main` | `uv run ops/workflow.py install` | Installs Bun dependencies inside `main/` directory. |

### Database (PostgreSQL & Drizzle ORM)

| Command | Underlying Action | Description |
| :--- | :--- | :--- |
| `bun run db:push` | `uv run ops/workflow.py db push` | Pushes the Drizzle schema directly to the PostgreSQL database. |
| `bun run db:generate` | `uv run ops/workflow.py db generate` | Generates new SQL migration files from `db/schema.ts`. |
| `bun run db:migrate` | `uv run ops/workflow.py db migrate` | Runs pending database migrations. |
| `bun run db:studio` | `uv run ops/workflow.py db studio` | Opens Drizzle Studio browser interface for visual data inspection. |
| `bun run db:sync` | `uv run ops/workflow.py db sync` | Runs `scripts/db-sync.ts` utility script. |

### Telegram Webhook Management (Production / Cloudflare)

| Command | Underlying Action | Description |
| :--- | :--- | :--- |
| `bun run webhook:set` | `uv run ops/workflow.py webhook set` | Registers the webhook URL with Telegram servers. |
| `bun run webhook:info` | `uv run ops/workflow.py webhook info` | Inspects current webhook configuration and pending update counts. |
| `bun run webhook:delete` | `uv run ops/workflow.py webhook delete` | Deletes current webhook from Telegram servers. |

### General CLI Runner

| Command | Underlying Action | Description |
| :--- | :--- | :--- |
| `bun run fana --help` | `uv run ops/workflow.py --help` | Displays the help manual and options for all workflow subcommands. |
