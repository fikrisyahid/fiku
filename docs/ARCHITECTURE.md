# Arsitektur Sistem Fiku

Dokumen ini memberikan gambaran tingkat tinggi mengenai arsitektur **Fiku Zero-Knowledge Personal Finance Platform**.

---

## 🏗️ Komponen Sistem

Fiku dibangun sebagai aplikasi **Next.js modern (App Router)** murni berbasis Web yang dirancang untuk kemudahan deploy di Vercel / serverless environment dengan PostgreSQL Supabase dan enkripsi Zero-Knowledge:

```
[ Pengguna (Web & Mobile Browser) ]
               │
               ▼
   [ Next.js 16 Web Application ]
   ├── / (Landing Page & Live Interactive Sandbox Preview)
   ├── /login (Email & Password Auth)
   ├── /transaction (Live Spreadsheet, Smart Input, /saldo, /kantong, /kategori)
   └── /summary (Filter Periode Harian/Mingguan/Bulanan/Tahunan, Metrik, Grafik Arus Kas)
               │
               ▼
    [ Server Actions & Lib Layer ]
    ├── app/actions/auth.ts (Autentikasi, Key Derivation, Session Cookie)
    ├── app/actions/transactions.ts (Spreadsheet Live-Sync, Transfer, Batch Mutations)
    ├── app/actions/accounts.ts & categories.ts
    ├── lib/smart-input.ts (Natural Language Transaction Parser - Bilingual ID & EN)
    └── lib/crypto.ts (Zero-Knowledge RAM Session Vault, X25519 Ephemeral ECDH + AES-256-GCM)
               │
               ▼
     [ PostgreSQL Database Layer ]
     └── Drizzle ORM Schema (Supabase Session Pooler)
         ├── users (Profile & Public Key)
         ├── sessions (Session Tokens)
         ├── accounts (Encrypted Balances)
         ├── categories (Categories)
         └── transactions (Encrypted Amounts & Notes)
```

1. **Next.js 16 Web App** (`main/app`):
   - **Autentikasi**: Menggunakan email dan password (bcrypt hash) dengan session cookie `fana_session` aman berdurasi 30 hari.
   - **Halaman Transaksi (`/transaction`)**:
     - *Live Interactive Spreadsheet*: Mengedit baris tanggal, tipe, kategori, kantong, nominal (otomatis format ribuan), dan keterangan dengan auto-save debounced (700ms).
     - *Transfer Antar Kantong*: Memindahkan dana dari kantong asal ke kantong tujuan tanpa menduplikasi data atau merusak saldo total.
     - *Bilingual Smart Input*: Pencatatan cepat dengan bahasa Indonesia maupun Inggris (contoh: `-25k sayur cash`, `-35k grilled chicken bca`, `tf 100k bca ke gopay`).
     - *Shortcut Bar*: Tombol `/saldo`, `/kantong`, `/kategori` dengan modal interaktif layaknya bot.
     - *Ekspor & Impor Excel*: Mengunduh format `.xlsx` berdasarkan rentang waktu atau mengimpor file massal dengan template bawaan.
   - **Halaman Ringkasan (`/summary`)**:
     - Pilihan periode: Harian, Mingguan, Bulanan, Tahunan.
     - Ringkasan akumulasi saldo, total pemasukan, pengeluaran, dan net surplus/defisit.
     - *Grafik Arus Kas*: Visualisasi tren keuangan responsif.
     - Alokasi pengeluaran per kategori & rincian saldo per kantong.
   - **Interactive Sandbox di Landing Page (`/`)**:
     - Pengunjung dapat mencoba langsung spreadsheet live dan ringkasan finansial tanpa registrasi.

2. **Lapisan Logika & Natural Text Parsing** (`main/lib/`):
   - `lib/smart-input.ts`: Mendukung parsing transaksi dan transfer dwibahasa (Indonesia & Inggris).

3. **Data Layer (PostgreSQL + Drizzle ORM)** (`main/db/`):
   - Koneksi ke PostgreSQL Supabase via Drizzle ORM.
   - Seluruh saldo akun (`accounts.balance`), nominal transaksi (`transactions.amount`), dan catatan (`transactions.note`) tersimpan dalam format terenkripsi `enc:v1:...`.

---

## 🔐 Model Keamanan & Zero-Knowledge Architecture

1. **Password Hashing**: Bcrypt dengan 10 salt rounds.
2. **Kunci Enkripsi Asimetris**: Setiap pengguna memiliki pasangan kunci X25519 (Curve25519). Public key disimpan di database untuk mengenkripsi data baru.
3. **Double Protection Private Key**: Private key pengguna dienkripsi dengan kombinasi Password pengguna, per-user salt, server pepper, dan master application secret key (`APP_SECRET_KEY`).
4. **RAM Session Vault**: Private key hanya didekripsi saat sesi login aktif dan disimpan sementara di in-memory RAM server (`getActiveUserPrivateKey`), memastikan data rahasia tidak pernah tersimpan terbuka di database.
