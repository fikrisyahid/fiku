# Panduan Kontribusi (Contributing Guide)

Terima kasih atas ketertarikan Anda untuk berkontribusi pada pengembangan **Fiku**! 🌟

Fiku adalah platform manajemen keuangan pribadi dengan arsitektur **Zero-Knowledge Encryption** (ECIES X25519 + AES-256-GCM). Dokumen ini menjelaskan alur kerja, standar kode, dan langkah-langkah praktis untuk berkontribusi.

---

## 🧭 Alur Kerja Branch & Git (Branch Flow)

Untuk menjaga stabilitas lingkungan produksi (Continuous Deployment di Vercel), Fiku menerapkan alur kerja **Staged Trunk-Based Development**:

```text
[ Fork Kontributor ]
       │  (feat/... atau fix/...)
       ▼
 [ PR ke staging ] ──▶ [ Review & CI Test Suite ] ──▶ [ Merge ke staging ]
                                                              │
                                                              ▼ (Promote/PR oleh Maintainer)
                                                         [ branch main ] ──▶ [ Vercel Production Auto-Deploy ]
```

### Aturan Utama:
1. **Target Branch PR adalah `staging`**:
   - Kontributor **TIDAK DIPERBOLEHKAN** membuat Pull Request langsung ke branch `main`.
   - Branch `main` dilindungi oleh GitHub Ruleset dan Gatekeeper CI. PR langsung ke `main` dari kontributor luar akan otomatis diblokir/gagal.
2. **Promosi Staging ke Main**:
   - Setelah fitur teruji di branch `staging`, maintainer repository (`@fikrisyahid`) akan menggabungkan perubahan ke `main` untuk memicu deployment resmi ke Vercel production.

---

## 🛠️ Prasyarat & Lingkungan Pengembangan (Prerequisites)

Pastikan perkakas berikut telah terpasang di sistem operasi Anda (Linux/WSL2/macOS):

- **[Bun](https://bun.sh/)** (`bun >= 1.4`): Runtime JavaScript & package runner utama.
- **[uv](https://docs.astral.sh/uv/)** (Python >= 3.11): Digunakan oleh ops workflow runner untuk sinkronisasi `.env` otomatis.
- **PostgreSQL Database**:
  - Rekomendasi: Instance database [Supabase](https://supabase.com/) gratis (Session Pooler).
  - Atau database PostgreSQL lokal (versi 15+).
- **Git** (Dianjurkan mengonfigurasi GPG commit signing).

---

## 🚀 Langkah Menyiapkan Proyek (Step-by-Step Setup)

### 1. Fork & Clone Repository
```bash
# 1. Fork repositori fikrisyahid/fiku di GitHub
# 2. Clone fork Anda ke lokal
git clone https://github.com/<username-anda>/fiku.git
cd fiku

# 3. Buat branch baru dari branch staging
git checkout staging 2>/dev/null || git checkout -b staging origin/staging
git checkout -b feat/nama-fitur-anda
```

### 2. Konfigurasi Environment Variables
Salin file template konfigurasi di direktori root:
```bash
cp .env.example .env
```
Buka `.env` dan lengkapi konfigurasi berikut:
```env
# URL PostgreSQL Supabase
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Server Pepper (kriptografi PBKDF2)
ENCRYPTION_PEPPER=fana_secure_server_pepper_default_2026

# Kunci Rahasia Utama Aplikasi (Double Protection)
APP_SECRET_KEY=fana_app_secret_key_double_protection_2026
```
*(Sistem ops Fiku akan otomatis menyinkronkan `.env` root ke `main/.env`).*

### 3. Instalasi Dependensi
```bash
bun run install:main
```

### 4. Sinkronisasi Skema Database
Sinkronkan tabel, kolom, dan index komposit ke database PostgreSQL Anda:
```bash
bun run db:sync
```

*(Opsional: Jika Anda ingin mengisi data akun dummy demo untuk pengujian):*
```bash
bun run seed:dummy
```

### 5. Jalankan Server Pengembangan
```bash
bun run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 📋 Daftar Perintah (CLI Reference)

Jalankan semua perintah ini dari direktori root:

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run dev` | Menjalankan Next.js development server pada port 3000 |
| `bun run test` | Menjalankan seluruh unit & integration test suite (`tests/`) |
| `bun run check` | Memeriksa validasi tipe TypeScript (`tsc --noEmit`) |
| `bun run lint` | Menjalankan ESLint pada seluruh berkas kode |
| `bun run build` | Membuat build produksi Next.js untuk memastikan bebas error kompilasi |
| `bun run db:sync` | Menyinkronkan struktur tabel dan index ke PostgreSQL |
| `bun run db:studio` | Membuka antarmuka visual Drizzle Studio di browser |
| `bun run db:reset` | Mengosongkan seluruh data tabel database |
| `bun run sync:env` | Menyinkronkan berkas `.env` antara root dan direktori `main/` |

---

## 🔐 Standar Keamanan Zero-Knowledge (Wajib Diikuti)

Fiku menjunjung tinggi privasi data keuangan pengguna. Setiap kontributor wajib mematuhi aturan berikut:

1. **Dilarang Menyimpan Nilai Finansial Plaintext**:
   - Kolom `accounts.balance`, `transactions.amount`, dan `transactions.note` **WAJIB** dienkripsi menggunakan public key pengguna (`encryptWithPublicKey`) sebelum ditulis ke database.
   - Nilai tersimpan di database harus selalu berformat ciphertext: `enc:v1:<ephemeralPubDer>:<iv>:<authTag>:<ciphertext>`.
2. **Isolasi Private Key**:
   - Private key pengguna hanya boleh didekripsi di dalam memori saat sesi aktif dan disegel di dalam cookie HTTP-only terenkripsi (`fana_key_vault`). Jangan pernah mencatat (*log*) atau menyimpan private key plaintext ke disk atau database.
3. **Penyimpanan Password & PIN**:
   - Password menggunakan bcrypt (10 rounds).
   - PIN menggunakan SHA-256 hash dengan salt per-pengguna dan server pepper via `crypto.timingSafeEqual`.

---

## 🧪 Pengujian (Testing)

Setiap penambahan fitur atau perbaikan bug harus disertai pengujian yang relevan di direktori `tests/`:

- **Unit Test** (`tests/unit/`): Logika murni independen (fungsi kriptografi, format mata uang, perhitungan rentang tanggal).
- **Integration Test** (`tests/integration/`): Logika gabungan (pengurai teks alami Smart Input, logika paginasi & sorting).

Jalankan pengujian lokal sebelum mengajukan PR:
```bash
# 1. Jalankan test suite
bun run test

# 2. Pastikan type check bersih
bun run check

# 3. Pastikan build Next.js lulus
bun run build
```

---

## 📝 Standar Commit & Pengajuan Pull Request

### Konvensi Pesan Commit (Conventional Commits):
Format: `<type>(<scope>): <deskripsi singkat>`
- `feat(smart-input): tambahkan dukungan multi-currency pada transfer`
- `fix(summary): perbaiki kalkulasi saldo pada filter tahunan`
- `perf(db): tambahkan composite index untuk optimasi sorting tanggal`
- `test(crypto): tambahkan unit test untuk session vault`
- `docs(readme): perbarui panduan kontribusi`

### Mengajukan Pull Request:
1. Pastikan branch lokal Anda sudah sinkron dengan branch `staging` terbaru (`git pull origin staging`).
2. Buat Pull Request di GitHub dengan **base branch: `staging`** (bukan `main`).
3. Isi deskripsi PR sesuai template yang telah disediakan ([`.github/pull_request_template.md`](../.github/pull_request_template.md)).
4. Pastikan seluruh automated check (GitHub Actions CI) berstatus **hijau / lulus**.
5. Maintainer akan meninjau (*review*) kode Anda dan memberikan masukan atau menyetujui perubahan.

Terima kasih atas kontribusi Anda dalam membangun platform keuangan pribadi yang aman dan berorientasi privasi! 🚀
