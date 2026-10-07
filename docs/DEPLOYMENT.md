# Deployment & Operations Guide

Dokumen ini menjelaskan strategi deployment untuk **Fana**, mulai dari development lokal hingga produksi di **Cloudflare Workers**.

---

## 💻 1. Development Mode (Lokal)

Saat pengembangan lokal:
- Web Dashboard berjalan via `bun run dev` (port 3000).
- Bot Telegram berjalan via `bun run bot:dev` (menggunakan **long-polling** bawaan GrammY, sehingga tidak membutuhkan URL HTTPS publik untuk testing bot).

---

## ☁️ 2. Arsitektur Cloudflare Worker (Produksi)

Ketika aplikasi dideploy ke Cloudflare Workers:
1. **Serverless HTTP Webhook**:
   - Long-polling **tidak** digunakan di serverless runtime.
   - Telegram Bot menerima request update melalui endpoint webhook:
     `POST https://<domain-kamu>/api/bot`
   - Framework GrammY mendukung adapter webhook standar (`webhookCallback(bot, "std/http")`) yang native dan kompatibel dengan fetch API Cloudflare Worker.

2. **Database Connection (PostgreSQL)**:
   - Gunakan PostgreSQL provider yang mendukung koneksi edge/serverless via Hyperdrive atau connection pooler (misal: Supabase, Neon, Prisma Accelerate, atau Cloudflare Hyperdrive).
   - Pastikan driver database mendukung runtime V8/Workers (seperti `@neondatabase/serverless` atau `postgres` dengan TCP connection).

3. **Mendaftarkan Webhook ke Telegram**:
   Jalankan script konfigurasi webhook:
   ```bash
   cd main
   TELEGRAM_BOT_WEBHOOK_URL="https://<domain-kamu>/api/bot" bun run webhook:set
   ```
   Untuk mengecek status webhook:
   ```bash
   bun run webhook:info
   ```

---

## 🔒 3. Environment Variables Penting

| Variabel | Keterangan |
| :--- | :--- |
| `DATABASE_URL` | URL koneksi PostgreSQL (contoh: `postgres://user:pass@host:5432/db`) |
| `TELEGRAM_BOT_TOKEN` | Token bot dari BotFather di Telegram |
| `TELEGRAM_BOT_WEBHOOK_URL` | URL publik endpoint webhook bot di Cloudflare Worker |
| `ENCRYPTION_PEPPER` | String rahasia acak untuk pepper kriptografi PIN |
| `NEXTAUTH_SECRET` / `SESSION_SECRET` | Secret key untuk signing cookie sesi |
