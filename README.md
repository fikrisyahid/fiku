# Fana - Personal & Family Finance Management

Fana adalah sistem manajemen keuangan pribadi dan keluarga multi-platform berbasis **Next.js 16**, **TypeScript**, dan **Telegram Bot** (GrammY). Seluruh data keuangan disinkronisasi secara real-time dan terenkripsi.

---

## 📁 Struktur Repositori

```text
fana/
├── main/              # Source code utama aplikasi (Next.js, Telegram Bot, DB, API)
│   ├── app/           # App Router Next.js (Dashboard web, Server Actions, API Webhook)
│   ├── components/    # Komponen antarmuka pengguna (Tailwind v4, Shadcn)
│   ├── db/            # Definisi skema database Drizzle ORM (PostgreSQL)
│   ├── drizzle/       # File migrasi database
│   ├── lib/           # Logika bisnis, enkripsi kriptografi, GrammY Telegram bot & command handlers
│   ├── public/        # Asset statis
│   ├── scripts/       # Script otomasi dev (webhook setup, local long-polling bot, db-sync)
│   └── package.json   # Konfigurasi dependensi Bun/Next.js
├── docs/              # Dokumentasi lengkap arsitektur, bot commands, database, dan deployment
│   ├── ARCHITECTURE.md
│   ├── TELEGRAM_BOT.md
│   ├── DATABASE.md
│   └── DEPLOYMENT.md
├── ops/               # File konfigurasi operasional, CI/CD, dan deployment Cloudflare
│   ├── workflows/     # GitHub Actions workflow (CI/CD pipeline)
│   └── wrangler.toml  # Contoh/template konfigurasi Cloudflare Worker
└── .gitignore         # Root git ignore rules
```

---

## 🚀 Fitur Utama

1. **Multi-Mode Finance**:
   - **Mode Personal**: Pencatatan keuangan terisolasi per individu.
   - **Mode Keluarga**: Kolaborasi finansial bersama anggota keluarga (Admin/Member role).
2. **Dual-Platform Synchronous**:
   - **Telegram Bot**: Input transaksi natural language (`-25k kopi susu`), cek saldo instan (`/saldo`), transfer antar dompet (`/tf`), kelola alokasi anggaran (`/alokasi`), dan manajemen utang (`/utang`).
   - **Web Dashboard**: Visualisasi ringkasan total saldo, daftar rekening/dompet, dan riwayat transaksi interaktif.
3. **Keamanan & Kriptografi**:
   - Zero-Knowledge session vault (RAM memory cache).
   - Derivasi kunci PBKDF2 (PIN + Salt + Pepper) & enkripsi AES-256-GCM.
   - Keypair X25519 (Curve25519) per akun.
4. **Cloud-Ready Architecture**:
   - Siap dideploy ke serverless runtime / Cloudflare Workers.

---

## 🛠️ Menjalankan Lokal (Development)

Project ini memiliki runner terintegrasi berbasis **Bun** dan **Python via `uv`** (`ops/workflow.py`). Developer **cukup menjalankan command dari root** menggunakan `bun run <command>` tanpa perlu berpindah ke folder `main/`.

### Persyaratan:
- [Bun](https://bun.sh/) (`bun >= 1.4`)
- [uv](https://docs.astral.sh/uv/) (Python package & project manager)

### Quick Start:

```bash
# 1. Setup file environment di root
cp .env.example .env
# Edit file .env di root (sinkronisasi ke main/.env berjalan otomatis)

# 2. Install dependensi
bun run install:main

# 3. Jalankan Web Dashboard
bun run dev

# 4. Jalankan Telegram Bot (mode polling)
bun run bot:dev
```

### Ringkasan Command Bun di Root:

| Command (di Root) | Deskripsi | Target Eksekusi |
| :--- | :--- | :--- |
| `bun run dev` | Menjalankan Next.js Web Dashboard | `main/` (port 3000) |
| `bun run bot:dev` (atau `bun run bot`) | Menjalankan Telegram Bot lokal (long-polling) | `main/` (`scripts/dev-bot.ts`) |
| `bun run check` | Menjalankan TypeScript Typecheck | `tsc --noEmit` di `main/` |
| `bun run lint` | Menjalankan ESLint | `eslint` di `main/` |
| `bun run build` | Membuat production build Next.js | `next build` di `main/` |
| `bun run sync:env` | Sinkronisasi manual file `.env` root ↔ `main/` | Python env synchronizer |
| `bun run db:push` | Push skema database Drizzle ORM | `drizzle-kit push` |
| `bun run db:studio` | Buka Drizzle Studio web GUI | `drizzle-kit studio` |
| `bun run webhook:info` | Cek status webhook Telegram | `scripts/set-webhook.ts` |
| `bun run fana --help` | Melihat seluruh opsi dan sub-command lengkap | CLI Runner |

