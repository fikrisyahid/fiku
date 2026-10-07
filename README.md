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

Pastikan telah menginstal [Bun](https://bun.sh/) (`bun >= 1.4`).

```bash
cd main

# 1. Install dependensi
bun install

# 2. Setup file environment
cp .env.example .env
# Edit .env dan isi DATABASE_URL, TELEGRAM_BOT_TOKEN, dsb.

# 3. Sinkronisasi skema database
bun run db:push

# 4. Jalankan Web Dashboard
bun run dev

# 5. Jalankan Telegram Bot (mode polling untuk lokal)
bun run bot:dev
```

Untuk panduan lebih lengkap, silakan kunjungi direktori [`docs/`](file:///D:/Dev/fana/docs).
