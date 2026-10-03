export interface BotCommandDef {
  command: string;
  description: string;
  usage: string;
  example: string;
  category: "umum" | "dompet" | "transaksi" | "alokasi" | "utang" | "pengaturan";
}

export const BOT_COMMANDS: BotCommandDef[] = [
  // UMUM
  {
    command: "start",
    description: "Memulai & mendaftarkan akun (onboarding)",
    usage: "/start",
    example: "/start",
    category: "umum",
  },
  {
    command: "help",
    description: "Menampilkan panduan lengkap semua perintah",
    usage: "/help",
    example: "/help",
    category: "umum",
  },

  // DOMPET
  {
    command: "saldo",
    description: "Cek saldo semua dompet & total aset keuangan",
    usage: "/saldo atau /dompet",
    example: "/saldo",
    category: "dompet",
  },
  {
    command: "dompet_utama",
    description: "Mengatur dompet default / utama untuk transaksi",
    usage: "/dompet_utama <nomor_atau_nama>",
    example: "/dompet_utama bca",
    category: "dompet",
  },
  {
    command: "tambah_dompet",
    description: "Membuat dompet / rekening baru",
    usage: "/tambah_dompet <nama> <cash|bank|ewallet> [saldo_awal]",
    example: "/tambah_dompet BCA bank 1500000",
    category: "dompet",
  },
  {
    command: "transfer",
    description: "Transfer / mutasi saldo antar dompet internal",
    usage: "/transfer <nominal> <dompet_asal> [ke] <dompet_tujuan> [catatan]",
    example: "/transfer 500k mandiri cash",
    category: "dompet",
  },
  {
    command: "tarik",
    description: "Tarik uang tunai dari rekening bank ke dompet cash",
    usage: "/tarik <nominal> [dompet_bank] [catatan]",
    example: "/tarik 500k mandiri",
    category: "dompet",
  },

  // TRANSAKSI
  {
    command: "catat",
    description: "Catat pengeluaran (out) atau pemasukan (in) dengan pilihan dompet di akhir",
    usage: "/catat <in|out> <nominal> <keterangan> [dompet]",
    example: "/catat out 25k bensin vario cash",
    category: "transaksi",
  },
  {
    command: "riwayat",
    description: "Lihat daftar riwayat transaksi terakhir",
    usage: "/riwayat [jumlah: default 5]",
    example: "/riwayat 10",
    category: "transaksi",
  },
  {
    command: "kategori",
    description: "Melihat daftar kategori pengeluaran & pemasukan",
    usage: "/kategori",
    example: "/kategori",
    category: "transaksi",
  },

  // ALOKASI DANA / BUDGET
  {
    command: "alokasi",
    description: "Cek alokasi dana aktif & persentase pemakaiannya",
    usage: "/alokasi",
    example: "/alokasi",
    category: "alokasi",
  },
  {
    command: "tambah_alokasi",
    description: "Buat alokasi anggaran dengan rentang waktu",
    usage: "/tambah_alokasi <nama> <nominal> <nama_kategori> [hari: default 30]",
    example: "/tambah_alokasi Makan-Bulanan 1500000 Makan & Minum 30",
    category: "alokasi",
  },

  // UTANG & PIUTANG
  {
    command: "utang",
    description: "Cek daftar utang (kita pinjam) & piutang (orang pinjam)",
    usage: "/utang",
    example: "/utang",
    category: "utang",
  },
  {
    command: "tambah_utang",
    description: "Catat utang atau piutang baru",
    usage: "/tambah_utang <nama_orang> <nominal> <utang|piutang> [keterangan]",
    example: "/tambah_utang Budi 100000 piutang pinjam uang makan",
    category: "utang",
  },
  {
    command: "lunas",
    description: "Menandai utang/piutang telah lunas",
    usage: "/lunas <id_singkat>",
    example: "/lunas 1",
    category: "utang",
  },

  // PENGATURAN & WIPEOUT
  {
    command: "reset",
    description: "Hapus seluruh data akun & keuangan (wipeout) ke posisi awal",
    usage: "/reset",
    example: "/reset",
    category: "pengaturan",
  },
];

export function getHelpMessage(): string {
  return (
    `📖 *PANDUAN PERINTAH FANA*\n` +
    `───────────────────\n\n` +
    `💰 *DOMPET & SALDO*\n` +
    `• \`/saldo\` — Cek saldo semua dompet\n` +
    `• \`/dompet_utama <nomor/nama>\` — Atur dompet utama\n` +
    `• \`/tambah_dompet <nama> <tipe> [saldo]\`\n` +
    `  _Contoh:_ \`/tambah_dompet Mandiri bank 500k\`\n\n` +
    `🔁 *TRANSFER & TARIK TUNAI*\n` +
    `• \`/tf <nominal> <asal> [ke] <tujuan>\` — Pindah saldo\n` +
    `  _Contoh:_ \`/tf 500k mandiri ke cash\`\n` +
    `  _Contoh:_ \`/tf 100k bca gopay topup\`\n` +
    `• \`/tarik <nominal> [bank]\` — Tarik tunai ke Cash\n` +
    `  _Contoh:_ \`/tarik 500k mandiri\`\n\n` +
    `📝 *CATAT TRANSAKSI*\n` +
    `• \`/catat <in|out> <nominal> <keterangan> [dompet]\`\n` +
    `  _Contoh:_ \`/catat out 25k bensin vario cash\`\n` +
    `  _Contoh:_ \`/catat in 500k freelance bca\`\n` +
    `• \`/riwayat [jumlah]\` — Riwayat transaksi terakhir\n` +
    `• \`/kategori\` — Daftar kategori transaksi\n\n` +
    `⚡ *TIP CATAT CEPAT (TEKS ALAMI)*\n` +
    `• \`-25k bensin vario cash\`\n` +
    `• \`-35k makan siang gopay\`\n` +
    `• \`+5jt gaji bulanan bca\`\n` +
    `• \`tarik tunai 500k mandiri\`\n` +
    `• \`topup 100k gopay dari bca\`\n\n` +
    `🎯 *ALOKASI DANA (BUDGET)*\n` +
    `• \`/alokasi\` — Cek status & progress anggaran\n` +
    `• \`/tambah_alokasi <nama> <target> <kategori> [hari]\`\n` +
    `  _Contoh:_ \`/tambah_alokasi Jajan 500k Makan 30\`\n\n` +
    `🤝 *UTANG & PIUTANG*\n` +
    `• \`/utang\` — Cek daftar catatan aktif\n` +
    `• \`/tambah_utang <orang> <nominal> <utang|piutang> [catatan]\`\n` +
    `  _Contoh:_ \`/tambah_utang Budi 150k piutang\`\n` +
    `• \`/lunas <nomor>\` — Tandai catatan lunas\n\n` +
    `⚙️ *PENGATURAN*\n` +
    `• \`/reset\` — Hapus semua data & mulai dari awal`
  );
}
