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
    `📖 *Daftar Perintah Bot Keuangan Fana*\n\n` +
    `💰 *Saldo & Dompet:*\n` +
    `• \`/saldo\` — Cek saldo seluruh dompet\n` +
    `• \`/dompet_utama <nomor/nama>\` — Atur dompet utama\n` +
    `• \`/tambah_dompet <nama> <tipe> [saldo]\`\n` +
    `  Contoh: \`/tambah_dompet Mandiri bank 500000\`\n\n` +
    `🔁 *Transfer & Tarik Tunai:*\n` +
    `• \`/tf <nominal> <asal> [ke] <tujuan>\` — Mutasi saldo antar dompet\n` +
    `  Contoh: \`/tf 500k mandiri ke cash\`\n` +
    `  Contoh: \`/tf 100k bca gopay topup\`\n` +
    `• \`/tarik <nominal> [bank]\` — Tarik uang tunai ke Cash\n` +
    `  Contoh: \`/tarik 500k mandiri\`\n\n` +
    `📝 *Transaksi:*\n` +
    `• \`/catat <in|out> <nominal> <keterangan> [dompet]\`\n` +
    `  Contoh: \`/catat out 25k bensin vario cash\`\n` +
    `  Contoh: \`/catat in 500k freelance bca\`\n` +
    `• \`/riwayat [limit]\` — Riwayat transaksi\n` +
    `• \`/kategori\` — Daftar kategori sistem\n\n` +
    `💡 *Tip Catat Cepat (Tanpa Command):*\n` +
    `• \`-25k bensin vario cash\`\n` +
    `• \`-35k makan siang gopay\`\n` +
    `• \`+5jt gaji bulanan bca\`\n\n` +
    `🎯 *Alokasi Dana (Budget Range):*\n` +
    `• \`/alokasi\` — Cek status & persentase anggaran\n` +
    `• \`/tambah_alokasi <nama> <target> <kategori> [hari]\`\n` +
    `  Contoh: \`/tambah_alokasi Jajan 500000 Makan 30\`\n\n` +
    `🤝 *Utang & Piutang:*\n` +
    `• \`/utang\` — Daftar utang & piutang\n` +
    `• \`/tambah_utang <orang> <nominal> <utang|piutang> [catatan]\`\n` +
    `• \`/lunas <nomor>\` — Tandai lunas\n\n` +
    `⚙️ *Pengaturan & Akun:*\n` +
    `• \`/reset\` — Hapus semua data & mulai dari awal`
  );
}
