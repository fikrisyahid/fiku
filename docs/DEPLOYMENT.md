# Panduan Deployment (Vercel & Next.js)

Fiku adalah aplikasi **Next.js 16 (App Router)** murni berbasis web yang dioptimalkan untuk platform serverless modern seperti **Vercel**.

---

## 🚀 1. Deploy ke Vercel

### Langkah Cepat via Vercel Dashboard:
1. Impor repositori GitHub Fiku ke dashboard Vercel.
2. Di bagian **Root Directory**, pilih:
   ```
   main
   ```
3. Framework Preset akan otomatis terdeteksi sebagai **Next.js**.
4. Isi Environment Variables yang diperlukan (lihat tabel di bawah).
5. Klik **Deploy**.

---

## ⚙️ 2. Environment Variables yang Dibutuhkan

Pastikan variabel berikut telah dikonfigurasi di pengaturan Environment Variables Vercel:

| Variabel | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Supabase Session Pooler / Direct) | `postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres` |
| `ENCRYPTION_PEPPER` | Secret key server untuk proteksi kriptografi | `fana_secure_server_pepper_2026` |
| `APP_SECRET_KEY` | Master secret key server untuk double protection data enkripsi | `fana_production_secret_key_32_characters` |

---

## 🛠️ 3. Menjalankan di Lokal (Local Development)

```bash
# Clone dan pindah ke root project
cd fana

# Install dependensi
bun install

# Salin template environment
cp .env.example .env

# Jalankan sinkronisasi database
bun run db:sync

# (Opsional) Seed data dummy demo
bun run seed:dummy

# Jalankan development server
bun run dev
```

Aplikasi dapat diakses di browser pada `http://localhost:3000`.
