# Telegram Bot Commands & Interactions

Telegram bot Fana dibangun dengan framework [GrammY](https://grammy.dev/) dan mendukung dua mode interaksi: **Command Berbasis Teks** dan **Smart Natural Text Parsing**.

---

## 💡 Smart Natural Text Parsing

Pengguna dapat mencatat pengeluaran atau pemasukan tanpa harus mengetik perintah `/catat`.

- Pengeluaran:
  - `-25k kopi susu` -> Catat pengeluaran Rp 25.000 kategori Makan & Minum.
  - `-15000 bensin pertalite` -> Catat pengeluaran Rp 15.000.
- Pemasukan:
  - `+5jt gaji bulanan` -> Catat pemasukan Rp 5.000.000.
  - `+50k bonus freelance` -> Catat pemasukan Rp 50.000.

---

## 📜 Daftar Command Bot

### 1. Keamanan & Akun
- `/start` - Inisialisasi bot dan onboarding user baru.
- `/help` - Menu bantuan interaktif dengan tombol inline.
- `/set_pin <pin>` - Menyetel PIN keamanan (6 digit angka).
- `/buka <pin>` - Membuka sesi enkripsi dompet.
- `/kunci` - Mengunci sesi enkripsi.
- `/reset` - Menghapus seluruh data pengguna (wipeout dengan konfirmasi 2 langkah).

### 2. Dompet & Saldo
- `/saldo` atau `/dompet` - Melihat daftar dompet dan rincian saldo.
- `/dompet_utama <nama_dompet>` - Mengubah dompet default untuk transaksi.
- `/tambah_dompet <nama> [tipe] [saldo_awal]` - Menambah rekening/dompet baru (`bank`, `ewallet`, `cash`).
- `/edit_dompet <nama_lama> <nama_baru>` - Mengubah nama dompet.
- `/hapus_dompet <nama>` - Menghapus rekening/dompet.
- `/transfer <dari> ke <tujuan> <nominal>` (alias: `/tf`) - Memindahkan dana antar dompet.
- `/tarik <dari_bank> <nominal>` - Tarik tunai dari bank ke dompet cash.

### 3. Transaksi & Kategori
- `/catat <tipe> <nominal> <kategori> [catatan]` - Mencatat transaksi eksplisit (`masuk` / `keluar`).
- `/riwayat` - Menampilkan daftar transaksi terakhir.
- `/kategori` - Menampilkan daftar kategori aktif.
- `/tambah_kategori <tipe> <nama> [icon]` - Menambah kategori baru.
- `/edit_kategori <nama_lama> <nama_baru>` - Mengubah nama kategori.
- `/hapus_kategori <nama>` - Menghapus kategori.

### 4. Alokasi Anggaran (Budgets)
- `/alokasi` - Melihat status alokasi anggaran dan sisa limit per kategori.
- `/tambah_alokasi <kategori> <limit> [start_date] [end_date]` - Menetapkan plafon anggaran.

### 5. Utang & Piutang (Debts)
- `/utang` - Melihat daftar utang (yang harus dibayar) dan piutang (yang harus ditagih).
- `/tambah_utang <tipe> <pihak> <nominal> [jatuh_tempo] [catatan]` - Mencatat utang/piutang baru (`utang` / `piutang`).
- `/lunas <id_utang>` - Menandai utang/piutang telah lunas.

### 6. Mode Keluarga (Family Mode)
- `/keluarga` - Melihat status keluarga, anggota, dan saldo bersama.
- `/buat_keluarga <nama>` - Membuat grup keluarga baru (pembuat otomatis jadi admin).
- `/undang_keluarga <username/telegram_id>` - Mengundang anggota keluarga.
- `/mode` - Mengganti mode aktif (`personal` <-> `family`).
