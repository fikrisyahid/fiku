## Ringkasan Perubahan

<!-- Jelaskan secara singkat masalah yang diselesaikan dan solusi/fitur yang diimplementasikan. -->

## Jenis Perubahan

- [ ] 🚀 **Fitur Baru** (`feat`)
- [ ] 🐛 **Perbaikan Bug** (`fix`)
- [ ] ⚡ **Optimalisasi / Performa** (`perf`)
- [ ] 📝 **Dokumentasi** (`docs`)
- [ ] 🧪 **Pengujian / Test** (`test`)
- [ ] 🛠️ **Refactoring / Maintenance** (`refactor` / `chore`)

## Pengujian & Verifikasi

<!-- Jelaskan langkah pengujian yang telah dilakukan di lingkungan lokal. -->
- [ ] `bun run test` (Seluruh unit & integration test lolos tanpa kegagalan)
- [ ] `bun run check` (TypeScript type check lolos tanpa error)
- [ ] `bun run lint` (ESLint bersih)
- [ ] `bun run build` (Build Next.js produksi berhasil)

## Zero-Knowledge & Security Compliance

- [ ] **Tidak ada nilai finansial plaintext** (nominal, saldo, catatan) yang disimpan atau dibocorkan langsung ke database tanpa enkripsi `X25519` + `AES-256-GCM`.
- [ ] Tidak ada data sensitif (API key, server pepper, private key) yang ter-commit ke repositori.

## Checklist Kontributor

- [ ] Target branch PR adalah **`staging`** (bukan langsung `main`).
- [ ] Pesan commit mengikuti konvensi Semantic Commit (`feat:`, `fix:`, `perf:`, dsb).
- [ ] Dokumentasi yang relevan telah diperbarui di folder `docs/` (jika ada perubahan skema, perintah, atau alur).
