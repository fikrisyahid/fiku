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
    command: "edit_dompet",
    description: "Mengubah nama atau tipe dompet yang ada",
    usage: "/edit_dompet <nomor_atau_nama_lama> <nama_baru> [tipe]",
    example: "/edit_dompet BCA Bank-BCA bank",
    category: "dompet",
  },
  {
    command: "hapus_dompet",
    description: "Menghapus dompet (selama belum ada riwayat transaksi)",
    usage: "/hapus_dompet <nomor_atau_nama>",
    example: "/hapus_dompet 3",
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
  {
    command: "tambah_kategori",
    description: "Membuat kategori kustom baru (pengeluaran atau pemasukan)",
    usage: "/tambah_kategori <nama> <in|out> [emoji]",
    example: "/tambah_kategori Sedekah out 🤲",
    category: "transaksi",
  },
  {
    command: "edit_kategori",
    description: "Mengubah nama atau emoji kategori kustom",
    usage: "/edit_kategori <nomor_atau_nama> <nama_baru> [emoji]",
    example: "/edit_kategori 1 Infaq 🕌",
    category: "transaksi",
  },
  {
    command: "hapus_kategori",
    description: "Menghapus kategori kustom (hanya yang belum memiliki transaksi)",
    usage: "/hapus_kategori <nomor_atau_nama>",
    example: "/hapus_kategori 1",
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

import { InlineKeyboard } from "grammy";

export function getHelpMenuContent(section?: string): {
  text: string;
  keyboard: InlineKeyboard;
} {
  const mainKeyboard = new InlineKeyboard()
    .text("💰 Dompet & Saldo", "help_dompet")
    .text("📝 Catat Transaksi", "help_catat")
    .row()
    .text("🔁 Transfer & Tarik", "help_transfer")
    .text("🏷️ Kategori", "help_kategori")
    .row()
    .text("🎯 Alokasi Anggaran", "help_alokasi")
    .text("🤝 Utang & Piutang", "help_utang")
    .row()
    .text("⚡ Teks Alami (Cepat)", "help_smart")
    .text("⚙️ Pengaturan", "help_settings");

  const backKeyboard = new InlineKeyboard().text("◀️ Kembali ke Menu Panduan", "help_main");

  switch (section) {
    case "dompet":
      return {
        text:
          `💰 *PANDUAN: DOMPET & SALDO*\n` +
          `───────────────────\n\n` +
          `1️⃣ *Cek Saldo:*\n` +
          `\`/saldo\` atau \`/dompet\`\n` +
          `└ Melihat saldo semua dompet & total aset.\n\n` +
          `2️⃣ *Atur Dompet Utama:*\n` +
          `\`/dompet_utama <no/nama>\`\n` +
          `└ _Contoh:_ \`/dompet_utama 2\` atau \`/dompet_utama bca\`\n\n` +
          `3️⃣ *Tambah Dompet Baru:*\n` +
          `\`/tambah_dompet <nama> <tipe> [saldo]\`\n` +
          `└ Tipe: \`cash\`, \`bank\`, atau \`ewallet\`\n` +
          `└ _Contoh:_ \`/tambah_dompet BCA bank 1jt\`\n\n` +
          `4️⃣ *Edit Dompet:*\n` +
          `\`/edit_dompet <no/nama> <nama_baru> [tipe]\`\n` +
          `└ _Contoh:_ \`/edit_dompet BCA Bank-BCA\`\n\n` +
          `5️⃣ *Hapus Dompet:*\n` +
          `\`/hapus_dompet <no/nama>\`\n` +
          `└ _(Hanya dompet tanpa riwayat transaksi)_`,
        keyboard: backKeyboard,
      };

    case "catat":
      return {
        text:
          `📝 *PANDUAN: CATAT TRANSAKSI*\n` +
          `───────────────────\n\n` +
          `1️⃣ *Format Perintah:*\n` +
          `\`/catat <in|out> <nominal> <ket> [dompet]\`\n\n` +
          `2️⃣ *Pengeluaran (out):*\n` +
          `\`/catat out 25k bensin vario cash\`\n` +
          `└ Catat pengeluaran 25rb dari dompet cash.\n\n` +
          `3️⃣ *Pemasukan (in):*\n` +
          `\`/catat in 2.5jt freelance web bca\`\n` +
          `└ Catat pemasukan 2.5jt ke dompet bca.\n\n` +
          `4️⃣ *Riwayat Transaksi:*\n` +
          `\`/riwayat [jumlah]\`\n` +
          `└ _Contoh:_ \`/riwayat 10\` (default 5 transaksi)\n\n` +
          `💡 _Tips: Jika tidak menyebutkan dompet di akhir, sistem otomatis memakai Dompet Utama._`,
        keyboard: backKeyboard,
      };

    case "transfer":
      return {
        text:
          `🔁 *PANDUAN: TRANSFER & TARIK TUNAI*\n` +
          `───────────────────\n\n` +
          `1️⃣ *Transfer Antar Dompet:*\n` +
          `\`/tf <nominal> <asal> [ke] <tujuan> [catatan]\`\n` +
          `└ _Contoh:_ \`/tf 500k mandiri ke cash\`\n` +
          `└ _Contoh:_ \`/tf 100k bca gopay topup\`\n\n` +
          `2️⃣ *Tarik Tunai ke Cash:*\n` +
          `\`/tarik <nominal> [bank] [catatan]\`\n` +
          `└ Memindahkan saldo bank ke dompet tunai.\n` +
          `└ _Contoh:_ \`/tarik 500k mandiri\``,
        keyboard: backKeyboard,
      };

    case "kategori":
      return {
        text:
          `🏷️ *PANDUAN: KATEGORI*\n` +
          `───────────────────\n\n` +
          `1️⃣ *Lihat Daftar Kategori:*\n` +
          `\`/kategori\`\n` +
          `└ Menampilkan kategori sistem & kustom.\n\n` +
          `2️⃣ *Tambah Kategori Kustom:*\n` +
          `\`/tambah_kategori <nama> <in|out> [emoji]\`\n` +
          `└ _Contoh:_ \`/tambah_kategori Sedekah out 🤲\`\n` +
          `└ _Contoh:_ \`/tambah_kategori Bonus in 🎁\`\n\n` +
          `3️⃣ *Edit Kategori Kustom:*\n` +
          `\`/edit_kategori <no/nama> <nama_baru> [emoji]\`\n` +
          `└ _Contoh:_ \`/edit_kategori 1 Infaq 🕌\`\n\n` +
          `4️⃣ *Hapus Kategori Kustom:*\n` +
          `\`/hapus_kategori <no/nama>\`\n` +
          `└ _(Kategori sistem dilindungi & tidak bisa dihapus)_`,
        keyboard: backKeyboard,
      };

    case "alokasi":
      return {
        text:
          `🎯 *PANDUAN: ALOKASI ANGGARAN (BUDGET)*\n` +
          `───────────────────\n\n` +
          `1️⃣ *Cek Status Anggaran:*\n` +
          `\`/alokasi\`\n` +
          `└ Cek persentase progress dan sisa kuota belanja.\n\n` +
          `2️⃣ *Buat Alokasi Baru:*\n` +
          `\`/tambah_alokasi <nama> <target> <kategori> [hari]\`\n` +
          `└ _Contoh:_ \`/tambah_alokasi Makan 1.5jt Makan 30\`\n` +
          `└ _Contoh:_ \`/tambah_alokasi Liburan 3jt Liburan 14\``,
        keyboard: backKeyboard,
      };

    case "utang":
      return {
        text:
          `🤝 *PANDUAN: UTANG & PIUTANG*\n` +
          `───────────────────\n\n` +
          `1️⃣ *Cek Catatan Aktif:*\n` +
          `\`/utang\`\n` +
          `└ Daftar uang yang kita pinjam atau kita pinjamkan.\n\n` +
          `2️⃣ *Catat Baru:*\n` +
          `\`/tambah_utang <orang> <nominal> <utang|piutang> [catatan]\`\n` +
          `└ _Contoh:_ \`/tambah_utang Budi 150k piutang makan\`\n` +
          `└ _Contoh:_ \`/tambah_utang Andi 50k utang bensin\`\n\n` +
          `3️⃣ *Tandai Lunas:*\n` +
          `\`/lunas <nomor>\`\n` +
          `└ _Contoh:_ \`/lunas 1\``,
        keyboard: backKeyboard,
      };

    case "smart":
      return {
        text:
          `⚡ *PANDUAN: CATAT CEPAT (TEKS ALAMI)*\n` +
          `───────────────────\n` +
          `Kamu tidak perlu ketik perintah panjang! Cukup kirim chat biasa:\n\n` +
          `💸 *Pengeluaran:*\n` +
          `• \`-25k bensin vario cash\`\n` +
          `• \`-35rb nasi goreng gopay\`\n` +
          `• \`-150.000 belanja bulanan\`\n\n` +
          `💰 *Pemasukan:*\n` +
          `• \`+5jt gaji bulanan bca\`\n` +
          `• \`+500k freelance mandiri\`\n\n` +
          `🔁 *Transfer & Tarik:*\n` +
          `• \`tarik tunai 500k mandiri\`\n` +
          `• \`topup 100k gopay dari bca\`\n` +
          `• \`tf 200k bca ke cash\``,
        keyboard: backKeyboard,
      };

    case "settings":
      return {
        text:
          `⚙️ *PANDUAN: PENGATURAN & WEB*\n` +
          `───────────────────\n\n` +
          `🌐 *Fana Web Dashboard:*\n` +
          `Buka web di browser dan masukkan username Telegram kamu (@username) untuk login menggunakan kode OTP instan.\n\n` +
          `⚠️ *Reset Data Akun (Wipeout):*\n` +
          `\`/reset\`\n` +
          `└ Menghapus seluruh data transaksi, dompet, dan profil akun untuk mulai dari awal lagi (memerlukan 2 tahap konfirmasi).`,
        keyboard: backKeyboard,
      };

    case "main":
    default:
      return {
        text:
          `📖 *PANDUAN PENGGUNAAN FANA*\n` +
          `───────────────────\n` +
          `Pilih kategori panduan yang ingin kamu pelajari melalui tombol di bawah ini:`,
        keyboard: mainKeyboard,
      };
  }
}

export function getHelpMessage(): string {
  const { text } = getHelpMenuContent("main");
  return text;
}
