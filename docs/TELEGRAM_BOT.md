# Panduan Format Smart Input

Fitur **Smart Input** di Fana memungkinkan pencatatan transaksi secara instan tanpa perlu mengisi form bertahap, baik di bar pencarian pintar Web UI maupun pesan teks alami.

---

## 💡 Pola Penulisan Smart Input

Sistem otomatis mendeteksi tanda minus (`-`) untuk pengeluaran, tanda plus (`+`) untuk pemasukan, dan format transfer (`tf` / `transfer`):

### 1. Pengeluaran (Expense)
Format: `-[nominal] [keterangan] [nama_kantong]`
- `-25k sayur cash`
  - Nominal: Rp 25.000
  - Keterangan: sayur
  - Kantong: cash (Dompet Tunai)
- `-50k bensin vario cash`
  - Nominal: Rp 50.000
  - Keterangan: bensin vario
  - Kantong: cash
- `-15000 kopi kenangan bca`
  - Nominal: Rp 15.000
  - Keterangan: kopi kenangan
  - Kantong: bca

### 2. Pemasukan (Income)
Format: `+[nominal] [keterangan] [nama_kantong]`
- `+5jt gaji bulanan bca`
  - Nominal: Rp 5.000.000
  - Keterangan: gaji bulanan
  - Kantong: bca
- `+50k bonus freelance gopay`
  - Nominal: Rp 50.000
  - Keterangan: bonus freelance
  - Kantong: gopay

### 3. Transfer Antar Kantong
Format: `tf [nominal] [kantong_asal] ke [kantong_tujuan]`
- `tf 100k bca ke gopay`
  - Memindahkan saldo Rp 100.000 dari BCA ke GoPay tanpa mengubah total saldo keseluruhan.
- `transfer 500k bank ke cash tarik atm`
  - Memindahkan saldo Rp 500.000 dari Bank ke Tunai dengan catatan "tarik atm".

---

## ⚡ Notasi Singkatan Nominal yang Didukung
- `k` atau `rb`: Ribu (contoh: `25k` = `25.000`)
- `jt` atau `m`: Juta (contoh: `2.5jt` = `2.500.000`)
- Angka polos: (contoh: `15000` = `15.000`)
