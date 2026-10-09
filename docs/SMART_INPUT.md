# Smart Input Formatting Guide (English & Indonesian)

The **Smart Input** feature in Fiku allows users to log transactions instantly using natural text without navigating multi-step forms, available directly in the smart input bar on the Web UI as well as quick shortcuts.

> **Note**: Smart Input relies on automatic keyword classification. Because category guessing is based on keywords, occasionally the chosen category might not be exact. Users can easily adjust or select the correct category directly within the live spreadsheet table.

---

## 💡 Smart Input Patterns

The system automatically recognizes the minus sign (`-`) for expenses, the plus sign (`+`) for income, and transfer keywords (`tf`, `transfer`, `move`):

### 1. English Mode

#### Expense
Format: `-[amount] [note] [wallet_name]`
- `-35k grilled chicken bca`
  - Amount: 35,000
  - Note: grilled chicken
  - Wallet: bca
- `-18k train ticket gopay`
  - Amount: 18,000
  - Note: train ticket
  - Wallet: gopay
- `-50 coffee meeting cash`
  - Amount: 50
  - Note: coffee meeting
  - Wallet: cash

#### Income
Format: `+[amount] [note] [wallet_name]`
- `+8.5m monthly salary bca`
  - Amount: 8,500,000
  - Note: monthly salary
  - Wallet: bca
- `+1m freelance design bank`
  - Amount: 1,000,000
  - Note: freelance design
  - Wallet: bank

#### Inter-Wallet Transfer
Format: `tf [amount] [from_wallet] to [to_wallet]` or `move [amount] [from_wallet] to [to_wallet]`
- `tf 200k bca to gopay`
  - Transfers 200,000 from BCA to GoPay without altering the user's aggregate balance.
- `move 50k gopay to cash`
  - Transfers 50,000 from GoPay to Cash.

---

### 2. Indonesian Mode (Bahasa Indonesia)

#### Expense (Pengeluaran)
Format: `-[nominal] [keterangan] [nama_kantong]`
- `-25k sayur cash`
  - Nominal: 25.000
  - Keterangan: sayur
  - Kantong: cash (Dompet Tunai)
- `-50k bensin vario cash`
  - Nominal: 50.000
  - Keterangan: bensin vario
  - Kantong: cash
- `-15000 kopi kenangan bca`
  - Nominal: 15.000
  - Keterangan: kopi kenangan
  - Kantong: bca

#### Income (Pemasukan)
Format: `+[nominal] [keterangan] [nama_kantong]`
- `+5jt gaji bulanan bca`
  - Nominal: 5.000.000
  - Keterangan: gaji bulanan
  - Kantong: bca
- `+50k bonus freelance gopay`
  - Nominal: 50.000
  - Keterangan: bonus freelance
  - Kantong: gopay

#### Inter-Wallet Transfer (Transfer Antar Kantong)
Format: `tf [nominal] [kantong_asal] ke [kantong_tujuan]`
- `tf 100k bca ke gopay`
  - Memindahkan saldo 100.000 dari BCA ke GoPay.
- `transfer 500k bank ke cash tarik atm`
  - Memindahkan saldo 500.000 dari Bank ke Tunai dengan catatan "tarik atm".

---

## ⚡ Supported Amount Abbreviations
- `k` or `rb` / `ribu`: Thousand (e.g., `25k` / `25rb` = `25,000`)
- `m` or `jt` / `juta`: Million (e.g., `2.5m` / `2.5jt` = `2,500,000`)
- Plain numbers: (e.g., `15000` = `15,000`, `1,500,000` = `1,500,000`)
