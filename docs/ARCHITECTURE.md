# Arsitektur Sistem Fana

Dokumen ini memberikan gambaran tingkat tinggi mengenai arsitektur **Fana Finance Platform**.

---

## 🏗️ Komponen Sistem

Fana dibangun sebagai aplikasi **Next.js modern (App Router)** yang dirancang untuk kemudahan deploy di Vercel / serverless environment dengan PostgreSQL Supabase:

```
[ Pengguna (Web & Mobile Browser) ]
               │
               ▼
   [ Next.js 16 Web Dashboard ]
   ├── /login (Email & Password Auth)
   ├── /transaksi (Live Spreadsheet, Smart Input, /saldo, /kantong, /kategori)
   └── /ringkasan (Filter Harian/Mingguan/Bulanan/Tahunan, Metrik, Grafik Arus Kas)
               │
               ▼
    [ Server Actions & Lib Layer ]
    ├── app/actions/auth.ts (Autentikasi & Session Cookie)
    ├── app/actions/transactions.ts (Spreadsheet Live-Sync, Transfer, Import Batch)
    ├── app/actions/accounts.ts & categories.ts
    ├── lib/smart-input.ts (Natural Language Transaction Parser)
    └── lib/crypto.ts (Double Protection: Salt, Secret Pepper, User Key Vault)
               │
               ▼
     [ PostgreSQL Database Layer ]
     └── Drizzle ORM Schema (Supabase Session Pooler)
```

1. **Next.js 16 Web App** (`main/app`):
   - **Autentikasi**: Menggunakan email dan password (bcrypt hash) dengan session cookie aman berdurasi 30 hari.
   - **Halaman Transaksi (`/transaksi`)**:
     - *Live Interactive Spreadsheet*: Mengedit baris tanggal, tipe, kategori, kantong, nominal (otomatis format ribuan), dan keterangan dengan auto-save debounced (700ms).
     - *Tipe Transfer Antar Kantong*: Memindahkan dana dari kantong asal ke kantong tujuan tanpa menduplikasi data atau merusak delta total saldo.
     - *Smart Natural Language Input*: Memungkinkan pencatatan cepat tanpa formulir rumit (contoh: `-25k sayur cash`, `tf 100k bca ke gopay`).
     - *Shortcut Bar*: Tombol `/saldo`, `/kantong`, `/kategori` dengan modal interaktif layaknya bot.
     - *Ekspor & Impor Excel*: Mengunduh format `.xlsx` berdasarkan rentang waktu atau mengimpor file massal dengan template yang dapat diunduh.
   - **Halaman Ringkasan (`/ringkasan`)**:
     - Pilihan periode: Harian, Mingguan, Bulanan, Tahunan.
     - Ringkasan akumulasi saldo, total pemasukan, pengeluaran, dan net surplus/defisit.
     - *Grafik Arus Kas*: Visualisasi batang responsif untuk tren keuangan.
     - Alokasi pengeluaran per kategori & rincian saldo per kantong.
   - **Tampilan Responsif**: Dilengkapi mobile toggleable sidebar drawer dan bebas horizontal overflow.

2. **Lapisan Logika & Natural Text Parsing** (`main/lib/`):
   - `lib/smart-input.ts`: Mengurai format teks fleksibel menjadi aksi pencatatan transaksi atau transfer.

3. **Data Layer (PostgreSQL + Drizzle ORM)** (`main/db/`):
   - Koneksi ke PostgreSQL Supabase via Drizzle ORM.
   - Model relasional mencakup pengguna, sesi, akun kantong/dompet, kategori, transaksi, dan grup keluarga.

---

## 🔐 Model Keamanan & Double Protection

- **Password Hashing**: Menggunakan bcrypt dengan salt rounds aman.
- **Double Protection Secret Key**: Data sensitif diamankan bersamaan dengan kombinasi password user serta secret key server (`ENCRYPTION_PEPPER` / `APP_SECRET_KEY`) dari environment `.env`.
- **Session Management**: Session token 256-bit berbasis httpOnly cookie untuk mencegah XSS.
