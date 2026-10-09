# Fiku - Zero-Knowledge Personal Finance Platform

Fiku adalah platform manajemen keuangan pribadi modern berbasis web yang dibangun dengan **Next.js 16**, **TypeScript**, **Tailwind CSS v4**, dan **PostgreSQL (Drizzle ORM)**. Seluruh data nominal, saldo dompet, dan catatan keuangan diamankan menggunakan arsitektur **Zero-Knowledge Encryption** (ECIES Asymmetric Encryption + AES-256-GCM).

---

## 📁 Struktur Repositori

```text
fana/
├── main/              # Sumber kode aplikasi utama (Next.js 16 Web App, Server Actions, DB, Crypto)
│   ├── app/           # Next.js App Router (/login, /transaction, /summary, /)
│   ├── components/    # Komponen antarmuka (Spreadsheet UI, Modals, Navbar, Charts)
│   ├── db/            # Definisi skema Drizzle ORM (PostgreSQL)
│   ├── lib/           # Logika bisnis, kriptografi Zero-Knowledge, i18n, Smart Input
│   ├── public/        # Asset statis, logo & screenshots
│   ├── scripts/       # Skrip otomatisasi (db-sync, db-reset, seed-dummy)
│   └── package.json   # Dependensi Next.js & Bun
├── docs/              # Dokumentasi teknis komprehensif
│   ├── ARCHITECTURE.md # Gambaran arsitektur sistem & alur enkripsi Zero-Knowledge
│   ├── DATABASE.md     # Skema tabel database & model data
│   ├── DEPLOYMENT.md   # Panduan deployment Vercel & environment variables
│   ├── SMART_INPUT.md  # Panduan format pencatatan cepat Smart Input (ID & EN)
│   └── COMMANDS.md     # Referensi seluruh perintah CLI & skrip
├── ops/               # Task runner & sinkronisasi otomatis
│   ├── workflow.py    # Python runner & sinkronisasi .env root <-> main/.env
│   └── pyproject.toml # Konfigurasi runner ops
├── package.json       # Root task runner forwarding commands
├── .gitignore         # Aturan git ignore
└── .env.example       # Template konfigurasi environment variables
```

---

## 🚀 Fitur Unggulan

1. **Live Interactive Spreadsheet (`/transaction`)**:
   - Pengalaman spreadsheet ala Google Sheets langsung di browser.
   - Edit baris tanggal, tipe (pemasukan/pengeluaran/transfer), kategori, kantong, nominal (format ribuan dinamis), dan keterangan secara instan dengan auto-save debounced.
   - Pengecekan saldo otomatis untuk mencegah pengeluaran melebihi saldo dompet yang tersedia.
   - Impor & Ekspor data transaksi massal format `.xlsx` (Excel).

2. **Bilingual Smart Natural Language Input**:
   - Ketik pencatatan secepat kilat dalam Bahasa Indonesia atau English tanpa form bertahap.
   - Contoh: `-25k ayam bakar bca`, `+5jt gaji bulanan mandiri`, `tf 100k bca ke gopay`, `-35k grilled chicken cash`, `move 50k gopay to cash`.

3. **Zero-Knowledge Encryption**:
   - Saldo dompet (`balance`), nominal transaksi (`amount`), dan catatan (`note`) dienkripsi di sisi klien/server menggunakan public key unik pengguna (`X25519`).
   - Tersimpan di PostgreSQL dalam format ciphertext terenkripsi (`enc:v1:...`). Admin atau pihak ketiga yang melihat database tidak dapat membaca nominal maupun catatan finansial pengguna.
   - Private key dienkripsi dengan kombinasi Password pengguna + per-user salt + server pepper + master secret key, dan hanya disimpan sementara di in-memory RAM session vault selama sesi login aktif.

4. **Ringkasan Visual Realtime (`/summary`)**:
   - Filter periode fleksibel: Harian, Mingguan, Bulanan, dan Tahunan.
   - Statistik akumulasi saldo, total pemasukan, pengeluaran, net surplus/defisit, grafik arus kas, dan diagram alokasi pengeluaran per kategori.

5. **Live Interactive Sandbox di Halaman Utama (`/`)**:
   - Calon pengguna dapat langsung mencoba live spreadsheet dan ringkasan interaktif di homepage tanpa perlu login.

---

## 🛠️ Pengembangan Lokal (Local Development)

Semua perintah dapat dijalankan langsung dari **root repositori** menggunakan `bun run`. Environment variables disinkronkan otomatis antara `.env` di root dan `main/.env`.

### Prasyarat:
- [Bun](https://bun.sh/) (`bun >= 1.4`)
- [uv](https://docs.astral.sh/uv/) (Python package runner untuk workflow runner ops)

### Panduan Mulai Cepat:

```bash
# 1. Setup environment variables di root
cp .env.example .env
# Isi DATABASE_URL, ENCRYPTION_PEPPER, dan APP_SECRET_KEY di .env

# 2. Install dependensi
bun run install:main

# 3. Sinkronkan skema database ke Supabase/PostgreSQL
bun run db:sync

# 4. (Opsional) Buat data akun demo terenkripsi Zero-Knowledge
bun run seed:dummy

# 5. Jalankan development server
bun run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Perintah Utama:

| Perintah | Aksi |
| :--- | :--- |
| `bun run dev` | Menjalankan Next.js Web App di port 3000 |
| `bun run check` | Memeriksa tipe TypeScript (`tsc --noEmit`) |
| `bun run lint` | Menjalankan linting ESLint |
| `bun run build` | Membuat production build Next.js |
| `bun run db:sync` | Sinkronisasi skema & constraint tabel database |
| `bun run db:reset` | Mengosongkan data database |
| `bun run db:push` | Mendorong perubahan skema Drizzle langsung ke DB |
| `bun run db:studio` | Membuka Drizzle Studio visual editor |
| `bun run seed:dummy` | Men-generate data akun dummy demo lengkap |

Untuk panduan lengkap, lihat [docs/COMMANDS.md](file:///docs/COMMANDS.md) dan [docs/ARCHITECTURE.md](file:///docs/ARCHITECTURE.md).
