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

Project ini memiliki runner terintegrasi berbasis **Python & uv** (`ops/workflow.py`), sehingga developer **cukup menjalankan command dari root** tanpa perlu berpindah ke folder `main/`.

### Persyaratan:
- [Bun](https://bun.sh/) (`bun >= 1.4`)
- [uv](https://docs.astral.sh/uv/) (Python package & project manager)

### Quick Start:

```bash
# 1. Setup file environment di root
cp .env.example .env
# Edit file .env di root (sinkronisasi ke main/.env otomatis)

# 2. Install dependensi
./fana install        # atau: uv run ops/workflow.py install

# 3. Jalankan Web Dashboard
./fana dev            # atau: uv run ops/workflow.py dev

# 4. Jalankan Telegram Bot (mode polling)
./fana bot            # atau: uv run ops/workflow.py bot
```

### Ringkasan Command Fana Runner:

| Command (di Root) | Deskripsi |
| :--- | :--- |
| `./fana dev` | Menjalankan Next.js Web Dashboard di port 3000 |
| `./fana bot` | Menjalankan Telegram Bot lokal (long-polling) |
| `./fana check` | Menjalankan TypeScript Typecheck (`tsc --noEmit`) |
| `./fana lint` | Menjalankan ESLint |
| `./fana build` | Membuat production build Next.js |
| `./fana sync-env` | Sinkronisasi manual file `.env` root ↔ `main/` |
| `./fana db push` | Push skema database Drizzle ORM |
| `./fana db studio` | Buka Drizzle Studio web GUI |
| `./fana webhook info` | Cek status webhook Telegram |
| `./fana --help` | Melihat seluruh opsi perintah |

> **Catatan Windows:** Di PowerShell atau Command Prompt, kamu bisa langsung mengetik `.\fana.cmd <command>` atau `uv run ops/workflow.py <command>`.

