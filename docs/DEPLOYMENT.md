# Deployment & Operations Guide

This guide describes deployment strategies for **Fana**, from local development to production on **Cloudflare Workers**.

---

## 💻 1. Local Development Mode

During local development:
- The Web Dashboard runs via `bun run dev` (port 3000).
- The Telegram Bot runs via `bun run bot:dev` (using **long-polling** via GrammY, eliminating the need for a public HTTPS webhook during local testing).

---

## ☁️ 2. Cloudflare Workers Production Architecture

When deployed to Cloudflare Workers:
1. **Serverless HTTP Webhook**:
   - Long-polling is **not** used in serverless edge runtimes.
   - Telegram sends updates to the public webhook endpoint:
     `POST https://<your-domain>/api/bot`
   - GrammY provides a native standard web fetch adapter (`webhookCallback(bot, "std/http")`) that runs seamlessly in Cloudflare Workers.

2. **Database Connectivity (PostgreSQL)**:
   - Use a PostgreSQL provider supporting serverless/edge environments via connection poolers or Cloudflare Hyperdrive (e.g. Supabase, Neon, or Hyperdrive).
   - Ensure the database driver supports V8 runtime requirements.

3. **Registering the Webhook with Telegram**:
   Configure the webhook via the built-in script:
   ```bash
   TELEGRAM_BOT_WEBHOOK_URL="https://<your-domain>/api/bot" bun run webhook:set
   ```
   To inspect the current webhook status:
   ```bash
   bun run webhook:info
   ```

---

## 🔒 3. Required Environment Variables

| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgres://user:pass@host:5432/db`) |
| `TELEGRAM_BOT_TOKEN` | Bot token provided by Telegram BotFather |
| `TELEGRAM_BOT_WEBHOOK_URL` | Public HTTPS webhook endpoint on Cloudflare Workers |
| `ENCRYPTION_PEPPER` | Cryptographic secret pepper for PIN derivation |
| `NEXTAUTH_SECRET` / `SESSION_SECRET` | Secret key used for signing session cookies |
