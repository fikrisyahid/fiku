# CLI & Scripts Reference

Dokumen ini menjelaskan semua perintah yang tersedia di [`package.json`](file:///package.json) root dan `main/package.json`.

---

## 📋 Perintah Utama (Root / main)

### Development & Build

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run dev` | Menjalankan Next.js development server pada port 3000 (`http://localhost:3000`). |
| `bun run build` | Membuat production build Next.js yang teroptimasi. |
| `bun run start` | Menjalankan Next.js production server. |
| `bun run lint` | Menjalankan ESLint pada seluruh codebase. |

### Database (PostgreSQL & Drizzle ORM)

| Perintah | Deskripsi |
| :--- | :--- |
| `bun run db:sync` | Menjalankan sinkronisasi kolom dan relasi schema ke PostgreSQL Supabase (`scripts/db-sync.ts`). |
| `bun run db:reset` | Mengosongkan dan membersihkan seluruh isi data tabel database (`scripts/db-reset.ts`). |
| `bun run db:push` | Mendorong perubahan skema Drizzle langsung ke database PostgreSQL. |
| `bun run db:studio` | Membuka Drizzle Studio di browser untuk inspeksi data visual. |
