# CLI & Scripts Reference

This document describes all available commands configured in the root [`package.json`](file:///package.json) and `main/package.json`.

---

## 📋 Main Commands (Root / main)

### Development & Build

| Command | Description |
| :--- | :--- |
| `bun run dev` | Runs the Next.js development server on port 3000 (`http://localhost:3000`). |
| `bun run build` | Builds an optimized production bundle for Next.js. |
| `bun run start` | Starts the Next.js production server. |
| `bun run lint` | Runs ESLint across the entire codebase. |
| `bun run check` | Runs TypeScript type checking (`tsc --noEmit`). |

### Database (PostgreSQL & Drizzle ORM)

| Command | Description |
| :--- | :--- |
| `bun run db:sync` | Synchronizes schema columns and constraints with PostgreSQL Supabase (`scripts/db-sync.ts`). |
| `bun run db:reset` | Truncates and resets all database table rows (`scripts/db-reset.ts`). |
| `bun run db:push` | Pushes Drizzle schema changes directly to the PostgreSQL database. |
| `bun run db:studio` | Launches Drizzle Studio in the browser for visual data inspection. |
| `bun run seed:dummy` | Generates dummy demo data encrypted with Zero-Knowledge (`scripts/seed-dummy.ts`). |

### Additional Utilities

| Command | Description |
| :--- | :--- |
| `bun run sync:env` | Synchronizes `.env` files between root and the `main/` directory. |
| `bun run install:main` | Installs all Bun dependencies inside the `main/` directory. |
