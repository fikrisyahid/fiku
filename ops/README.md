# Operational Files & CI/CD

Folder ini berisi konfigurasi operasional, otomatisasi CI/CD, dan berkas deployment Cloudflare Workers.

---

## 📂 Berkas yang Tersedia

1. **`wrangler.toml`**: Konfigurasi Cloudflare Workers / OpenNext untuk mendeploy aplikasi Next.js dan webhook Telegram ke infrastruktur Cloudflare edge runtime.
2. **`ci-cd.yml`**: Template workflow GitHub Actions untuk proses linting, typechecking, build, dan otomatisasi deployment ke Cloudflare Workers saat branch `main` diperbarui.
3. **`.github/workflows/ci-cd.yml`**: Symlink/copy workflow aktif GitHub Actions.
