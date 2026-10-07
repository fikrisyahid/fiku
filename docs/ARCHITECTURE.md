# Fana Architecture Overview

Dokumen ini menjelaskan arsitektur tingkat tinggi dari **Fana Finance Platform**.

---

## 🏗️ Komponen Sistem

Sistem terdiri dari 3 pilar utama:

```
[ Telegram Client ]       [ Web Browser (User) ]
         │                           │
         ▼                           ▼
[ Telegram Webhook API ]    [ Next.js Dashboard UI ]
 (app/api/bot/route.ts)       (app/page.tsx, /login)
         │                           │
         └─────────────┬─────────────┘
                       ▼
             [ Server Actions & Lib ]
             - lib/bot.ts & handlers
             - lib/crypto.ts
             - app/actions/*
                       │
                       ▼
             [ PostgreSQL Database ]
              (Drizzle ORM Schema)
```

1. **Next.js 16 Web Dashboard** (`main/app`):
   - Memberikan antarmuka ringkas berbasis Tailwind CSS v4 & React 19.
   - Menggunakan Server Actions untuk mutasi data (`app/actions/`).
   - Autentikasi berbasis PIN dengan hashing HMAC/SHA256 ber-salt.

2. **Telegram Bot Service** (`main/lib/bot.ts`):
   - Menggunakan framework **GrammY**.
   - Di lingkungan lokal (dev), dijalankan via long-polling menggunakan script `scripts/dev-bot.ts`.
   - Di lingkungan produksi (Cloudflare / Serverless), dijalankan secara stateless via Webhook endpoint `POST /api/bot`.

3. **Data Layer (PostgreSQL + Drizzle ORM)** (`main/db/`):
   - Menggunakan connection pool PostgreSQL (`postgres`).
   - Relasi relasional lengkap untuk entitas user, dompet, kategori, alokasi anggaran, transaksi, utang, dan keluarga.

---

## 🔐 Model Keamanan & Enkripsi

- **PIN Security**: PIN pengguna diverifikasi menggunakan hashing SHA256 dengan kombinasi `Salt` per user dan `Server Pepper`.
- **Kriptografi Asimetris**: Setiap user memiliki pasangan kunci X25519 (Curve25519). Private key dienkripsi dengan AES-256-GCM menggunakan kunci turunan dari PBKDF2 (100.000 iterasi).
- **Session Vault**: Private key yang telah didekripsi disimpan sementara di in-memory session vault (RAM) dengan TTL 12 jam untuk mendukung operasi tanpa mengekspos kunci mentah ke database.
