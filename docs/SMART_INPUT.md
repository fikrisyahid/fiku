# Panduan Format Smart Input (Bahasa Indonesia & English)

Fitur **Smart Input** di Fiku memungkinkan pencatatan transaksi secara instan tanpa perlu mengisi form bertahap, baik di bar pencarian pintar Web UI maupun shortcut cepat.

> **Catatan**: Smart Input menggunakan deteksi kata kunci otomatis. Karena tebakan kategori didasarkan pada kata kunci, terkadang kategori yang dipilih bisa meleset atau kurang tepat. Pengguna dapat dengan mudah memilih atau mengganti kategori yang sesuai langsung di tabel spreadsheet.

---

## 💡 Pola Penulisan Smart Input

Sistem otomatis mendeteksi tanda minus (`-`) untuk pengeluaran, tanda plus (`+`) untuk pemasukan, dan format transfer (`tf`, `transfer`, `move`):

### 1. Mode Bahasa Indonesia

#### Pengeluaran (Expense)
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

#### Pemasukan (Income)
Format: `+[nominal] [keterangan] [nama_kantong]`
- `+5jt gaji bulanan bca`
  - Nominal: Rp 5.000.000
  - Keterangan: gaji bulanan
  - Kantong: bca
- `+50k bonus freelance gopay`
  - Nominal: Rp 50.000
  - Keterangan: bonus freelance
  - Kantong: gopay

#### Transfer Antar Kantong
Format: `tf [nominal] [kantong_asal] ke [kantong_tujuan]`
- `tf 100k bca ke gopay`
  - Memindahkan saldo Rp 100.000 dari BCA ke GoPay tanpa mengubah total saldo keseluruhan.
- `transfer 500k bank ke cash tarik atm`
  - Memindahkan saldo Rp 500.000 dari Bank ke Tunai dengan catatan "tarik atm".

---

### 2. Mode Bahasa Inggris (English Mode)

#### Expense
Format: `-[amount] [note] [wallet_name]`
- `-35k grilled chicken bca`
  - Amount: Rp 35,000
  - Note: grilled chicken
  - Wallet: bca
- `-18k train ticket gopay`
  - Amount: Rp 18,000
  - Note: train ticket
  - Wallet: gopay

#### Income
Format: `+[amount] [note] [wallet_name]`
- `+8.5m monthly salary bca`
  - Amount: Rp 8,500,000
  - Note: monthly salary
  - Wallet: bca
- `+1m ui design freelance bank`
  - Amount: Rp 1,000,000
  - Note: ui design freelance
  - Wallet: bank

#### Inter-Wallet Transfer
Format: `tf [amount] [from_wallet] to [to_wallet]` atau `move [amount] [from_wallet] to [to_wallet]`
- `tf 200k bca to gopay`
- `move 50k gopay to cash`

---

## ⚡ Notasi Singkatan Nominal yang Didukung
- `k` atau `rb` / `ribu`: Ribu (contoh: `25k` / `25rb` = `25.000`)
- `jt` atau `m` / `juta`: Juta (contoh: `2.5jt` / `2.5m` = `2.500.000`)
- Angka polos: (contoh: `15000` = `15.000`, `1.500.000` = `1.500.000`)
