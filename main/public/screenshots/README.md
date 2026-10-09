# Panduan Aset Gambar & Screenshot Fiku

Direktori ini disiapkan untuk menyimpan file tangkapan layar (screenshot) dan logo/identitas Fiku.

---

## 1. Screenshot Aplikasi (Homepage UI Showcase)
Simpan file di direktori: `main/public/screenshots/`

Komponen UI Showcase di Homepage otomatis mendeteksi dan menampilkan screenshot sesuai **tema aktif (Light / Dark)** yang dipilih user:

| Nama File | Format | Deskripsi |
|---|---|---|
| `screenshot-transactions-light.png` | PNG/JPG | Screenshot halaman Transaksi pada **Light Mode** |
| `screenshot-transactions-dark.png` | PNG/JPG | Screenshot halaman Transaksi pada **Dark Mode** |
| `screenshot-summary-light.png` | PNG/JPG | Screenshot halaman Ringkasan pada **Light Mode** |
| `screenshot-summary-dark.png` | PNG/JPG | Screenshot halaman Ringkasan pada **Dark Mode** |

*Tip resolusi screenshot ideal*: Lebar 1920x1080 atau 1600x1000 (aspek rasio 16:9 atau 16:10).  
*Graceful Fallback*: Jika file belum diisi atau tidak ditemukan, aplikasi otomatis menampilkan ilustrasi mockup interaktif bawaan yang menyatu dengan tema.

---

## 2. Brand & Logo Identitas
Simpan file di direktori: `main/public/brand/` dan `main/public/`

| Nama File | Path | Ukuran Rekomendasi | Penggunaan |
|---|---|---|---|
| `favicon.svg` | `main/public/favicon.svg` | Vektor SVG | Favicon browser modern |
| `fiku-icon.svg` | `main/public/brand/fiku-icon.svg` | Vektor SVG | Ikon logo Fiku murni |
| `fiku-logo.svg` | `main/public/brand/fiku-logo.svg` | Vektor SVG | Logo penuh (Ikon + teks "Fiku") |
| `fiku-logo-dark.svg` | `main/public/brand/fiku-logo-dark.svg` | Vektor SVG | Logo versi gelap untuk latar belakang gelap |
| `fiku-icon-192.png` | `main/public/brand/fiku-icon-192.png` | 192x192 px | PWA / Mobile touch icon |
| `fiku-icon-512.png` | `main/public/brand/fiku-icon-512.png` | 512x512 px | PWA / Splash screen icon |
| `og-image.png` | `main/public/brand/og-image.png` | 1200x630 px | OpenGraph Banner (Sosial media preview) |
