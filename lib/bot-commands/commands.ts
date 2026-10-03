export interface BotCommandDef {
  command: string;
  description: string;
  usage: string;
  example: string;
  category: "umum" | "dompet" | "transaksi" | "alokasi" | "utang";
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
    command: "tambah_dompet",
    description: "Membuat dompet / rekening baru",
    usage: "/tambah_dompet <nama> <cash|bank|ewallet> [saldo_awal]",
    example: "/tambah_dompet BCA bank 1500000",
    category: "dompet",
  },

  // TRANSAKSI
  {
    command: "catat",
    description: "Catat pengeluaran (out) atau pemasukan (in)",
    usage: "/catat <in|out> <nominal> <keterangan>",
    example: "/catat out 25000 Nasi Padang",
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
];

export function getHelpMessage(): string {
  return (
    `📖 *Daftar Perintah Bot Keuangan Fana*\n\n` +
    `💰 *Saldo & Dompet:*\n` +
    `• \`/saldo\` — Cek saldo seluruh dompet\n` +
    `• \`/tambah_dompet <nama> <tipe> [saldo]\`\n` +
    `  _Contoh: \`/tambah_dompet Mandiri bank 500000\`_\n\n` +
    `📝 *Transaksi:*\n` +
    `• \`/catat <in|out> <nominal> <keterangan>\`\n` +
    `  _Contoh: \`/catat out 35000 Kopi & Roti\`_\n` +
    `• \`/riwayat [limit]\` — Riwayat transaksi\n` +
    `• \`/kategori\` — Daftar kategori sistem\n` +
    `💡 *Tip:* Kamu juga bisa langsung chat santai seperti \`makan siang 25rb\`!\n\n` +
    `🎯 *Alokasi Dana (Budget Range):*\n` +
    `• \`/alokasi\` — Cek status & persentase anggaran\n` +
    `• \`/tambah_alokasi <nama> <target> <kategori> [hari]\`\n` +
    `  _Contoh: \`/tambah_alokasi Jajan 500000 Makan & Minum 30\`_\n\n` +
    `🤝 *Utang & Piutang:*\n` +
    `• \`/utang\` — Daftar utang & piutang\n` +
    `• \`/tambah_utang <orang> <nominal> <utang|piutang> [catatan]\`\n` +
    `• \`/lunas <nomor>\` — Tandai lunas`
  );
}
