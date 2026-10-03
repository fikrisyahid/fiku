import { Context } from "grammy";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { onboardUser } from "@/lib/onboarding";
import {
  getUserAccounts,
  createAccount,
  setDefaultAccount,
} from "@/app/actions/accounts";
import {
  createTransaction,
  getUserTransactions,
} from "@/app/actions/transactions";
import {
  getUserBudgets,
  createBudget,
} from "@/app/actions/budgets";
import {
  getUserDebts,
  createDebt,
  settleDebt,
} from "@/app/actions/debts";
import { getCategories } from "@/app/actions/categories";
import { wipeoutUserData } from "@/app/actions/reset";
import { getHelpMessage } from "./commands";

function formatRupiah(amount: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function makeProgressBar(percentage: number): string {
  const total = 10;
  const clamped = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((clamped / 100) * total);
  const empty = total - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}] ${percentage}%`;
}

function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

const TYPE_ALIASES: Record<string, string[]> = {
  cash: ["cash", "tunai", "dompet", "fisik"],
  bank: ["bank", "bca", "mandiri", "bri", "bni", "cimb", "jago", "jenius", "seabank", "rekening"],
  ewallet: ["ewallet", "e-wallet", "gopay", "ovo", "dana", "shopeepay", "spay", "linkaja"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Makan & Minum": [
    "makan", "minum", "kopi", "coffee", "cafe", "kafe", "resto", "bakso",
    "mie", "nasi", "sarapan", "lunch", "dinner", "jajan", "snack", "teh", "boba", "ayam", "padang"
  ],
  "Transport": [
    "bensin", "bbm", "pertalite", "pertamax", "solar", "vario", "beat", "nmax", "pcx", "motor", "mobil",
    "ojek", "gojek", "goride", "gocar", "grab", "grabfood", "maxim", "parkir", "tol", "kereta", "krl", "mrt", "busway"
  ],
  "Belanja": [
    "belanja", "beli", "shopee", "tokped", "tokopedia", "tiktok", "lazada", "indomaret", "alfamart",
    "supermarket", "baju", "celana", "sepatu", "skincare", "pasar"
  ],
  "Tagihan & Utilitas": [
    "listrik", "pln", "air", "pdam", "wifi", "indihome", "biznet", "pulsa", "kuota", "telkomsel", "xl", "indosat", "sewa", "kontrakan", "kos", "iuran"
  ],
  "Kesehatan": [
    "obat", "apotek", "dokter", "klinik", "rs", "rumah sakit", "vitamin", "bpjs"
  ],
  "Hiburan": [
    "nonton", "bioskop", "cinema", "game", "steam", "topup", "ml", "ff", "netflix", "spotify", "youtube", "liburan", "hotel"
  ],
  "Pendidikan": [
    "buku", "kursus", "les", "sekolah", "kuliah", "spp", "seminar"
  ],
  "Cicilan": [
    "cicilan", "kredit", "paylater", "spaylater", "kredivo", "angsuran"
  ],
  "Gaji": [
    "gaji", "salary", "payroll", "upah"
  ],
  "Freelance": [
    "freelance", "proyek", "project", "sidejob", "jasa", "klien"
  ],
  "Investasi": [
    "investasi", "saham", "reksadana", "crypto", "bibit", "ajaib", "emas"
  ],
  "Hadiah": [
    "hadiah", "gift", "giveaway", "angpao", "thr"
  ],
};

function matchesAccount(candidate: string, acc: { name: string; type: string }): boolean {
  const normCandidate = normalizeText(candidate);
  const normName = normalizeText(acc.name);
  const normType = normalizeText(acc.type);

  if (normCandidate === normName || normCandidate === normType) return true;

  const aliases = TYPE_ALIASES[acc.type] || [];
  if (aliases.includes(normCandidate)) return true;

  const nameTokens = normName.split(" ");
  if (nameTokens.includes(normCandidate)) return true;

  if (normName.includes(normCandidate) && normCandidate.length >= 3) return true;

  return false;
}

export function extractWalletAndDescription<T extends { name: string; type: string; isDefault?: boolean }>(
  fullText: string,
  accounts: T[]
): { wallet: T; description: string; matchedKeyword: string | null } {
  const words = fullText.trim().split(/\s+/);
  const defaultWallet = accounts.find((a) => a.isDefault) || accounts[0];

  if (words.length === 0) {
    return {
      wallet: defaultWallet,
      description: "",
      matchedKeyword: null,
    };
  }

  // Cek suffix dari belakang: coba 3 kata, 2 kata, 1 kata
  for (let len = Math.min(3, words.length); len >= 1; len--) {
    const candidateTokens = words.slice(words.length - len);
    const candidateStr = candidateTokens.join(" ");

    for (const acc of accounts) {
      if (matchesAccount(candidateStr, acc)) {
        const remainingWords = words.slice(0, words.length - len);
        const description = remainingWords.join(" ").trim();
        return {
          wallet: acc,
          description: description || acc.name,
          matchedKeyword: candidateStr,
        };
      }
    }
  }

  return {
    wallet: defaultWallet,
    description: fullText.trim(),
    matchedKeyword: null,
  };
}

export function findMatchingCategory(
  description: string,
  type: "income" | "expense",
  allCategories: { id: string; name: string; type: string; icon: string | null }[]
) {
  const normDesc = normalizeText(description);

  // 1. Cek langsung nama kategori yang muncul di deskripsi
  const directMatch = allCategories.find(
    (c) => c.type === type && normDesc.includes(normalizeText(c.name))
  );
  if (directMatch) return directMatch;

  // 2. Cek kamus sinonim/keyword kategori
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matchedKeyword = keywords.find((kw) => normDesc.includes(kw));
    if (matchedKeyword) {
      const found = allCategories.find(
        (c) => c.name.toLowerCase().includes(catName.toLowerCase()) && c.type === type
      );
      if (found) return found;
    }
  }

  // 3. Fallback: kategori Lainnya atau kategori pertama yang tipenya sesuai
  const fallback =
    allCategories.find((c) => c.type === type && c.name.toLowerCase().includes("lainnya")) ||
    allCategories.find((c) => c.type === type) ||
    allCategories[0];

  return fallback;
}

/**
 * Helper untuk mengambil user dari Telegram ID.
 * Tidak melakukan auto-onboarding diam-diam, melainkan meminta user menjalankan /start jika belum terdaftar.
 */
async function getTelegramUser(ctx: Context, notifyIfNotRegistered = true) {
  const telegramId = ctx.from?.id ? String(ctx.from.id) : null;
  if (!telegramId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.telegramId, telegramId),
  });

  if (!user && notifyIfNotRegistered) {
    await ctx.reply(
      `⚠️ *Akun belum terdaftar atau baru saja di-reset.*\n\n` +
        `Silakan ketik /start untuk mendaftarkan akun dan memulai onboarding!`,
      { parse_mode: "Markdown" }
    );
  }

  return user;
}

// 1. /start
export async function handleStart(ctx: Context) {
  const from = ctx.from;
  if (!from) return;

  const telegramId = String(from.id);
  const fullName =
    [from.first_name, from.last_name].filter(Boolean).join(" ") ||
    from.username ||
    "Sobat Fana";

  const result = await onboardUser({
    fullName,
    telegramId,
    telegramUsername: from.username || null,
  });

  const walletList = result.accounts
    .map((acc) => `• ${acc.name}: *${formatRupiah(acc.balance)}*`)
    .join("\n");

  if (result.isNewUser) {
    await ctx.reply(
      `🎉 *Selamat datang di Fana Finance, ${result.user.fullName}!* 👋\n\n` +
        `Akun keuanganmu berhasil dibuat!\n\n` +
        `💼 *Dompet Default:*\n` +
        `${walletList}\n\n` +
        `Ketik /help untuk panduan cara mencatat keuangan.`,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      `👋 *Halo kembali, ${result.user.fullName}!*\n\n` +
        `💼 *Status Dompet:*\n` +
        `${walletList}\n\n` +
        `Ketik /saldo untuk cek saldo atau langsung catat pengeluaranmu.`,
      { parse_mode: "Markdown" }
    );
  }
}

// 2. /saldo atau /dompet
export async function handleSaldo(ctx: Context) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const accountsList = await getUserAccounts(user.id);
  if (accountsList.length === 0) {
    await ctx.reply("Belum ada dompet terdaftar. Ketik /start untuk inisialisasi dompet.");
    return;
  }

  const total = accountsList.reduce((sum, a) => sum + Number(a.balance), 0);
  const rows = accountsList
    .map((a, idx) => {
      const isDef = a.isDefault ? " ⭐ _(Utama)_" : "";
      return `*#${idx + 1}* • *${a.name}* (${a.type}): ${formatRupiah(a.balance)}${isDef}`;
    })
    .join("\n");

  await ctx.reply(
    `💰 *Daftar Dompet (${user.fullName}):*\n\n` +
      `${rows}\n\n` +
      `💵 *Total Saldo:* *${formatRupiah(total)}*\n\n` +
      `💡 _Ganti dompet utama:_ \`/dompet_utama <nomor/nama>\``,
    { parse_mode: "Markdown" }
  );
}

// 2b. /dompet_utama <nomor_atau_nama>
export async function handleSetDefaultDompet(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const accountsList = await getUserAccounts(user.id);
  if (accountsList.length === 0) {
    await ctx.reply("Belum ada dompet terdaftar. Ketik /start untuk inisialisasi dompet.");
    return;
  }

  const query = match ? match.trim() : "";

  if (!query) {
    const rows = accountsList
      .map((a, idx) => {
        const isDef = a.isDefault ? " ⭐ _(Saat ini utama)_" : "";
        return `*#${idx + 1}* • *${a.name}* (${a.type})${isDef}`;
      })
      .join("\n");

    await ctx.reply(
      `💼 *Pilih Dompet Utama*\n\n` +
        `Dompet utama adalah dompet yang otomatis terpakai saat mencatat transaksi tanpa menyebutkan dompet.\n\n` +
        `${rows}\n\n` +
        `*Cara Ganti:* \`/dompet_utama <nomor atau nama>\`\n` +
        `_Contoh: \`/dompet_utama 2\` atau \`/dompet_utama bca\`_`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // 1. Coba cari berdasarkan nomor urut (#1, #2, dst.)
  const numIndex = parseInt(query, 10);
  let targetAccount =
    !isNaN(numIndex) && numIndex >= 1 && numIndex <= accountsList.length
      ? accountsList[numIndex - 1]
      : null;

  // 2. Jika bukan nomor urut, cari berdasarkan pencocokan nama atau tipe dompet
  if (!targetAccount) {
    targetAccount =
      accountsList.find((a) => matchesAccount(query, a)) ||
      accountsList.find((a) => a.name.toLowerCase().includes(query.toLowerCase())) ||
      null;
  }

  if (!targetAccount) {
    await ctx.reply(
      `Dompet "${query}" tidak ditemukan.\nKetik /saldo untuk melihat nomor dan nama dompet kamu.`
    );
    return;
  }

  try {
    const updated = await setDefaultAccount(targetAccount.id, user.id);
    await ctx.reply(
      `⭐ *Dompet Utama Berhasil Diubah!*\n\n` +
        `💼 Dompet Utama Sekarang: *${updated.name}* (${updated.type})\n` +
        `Saldo Saat Ini: *${formatRupiah(updated.balance)}*\n\n` +
        `Transaksi pengeluaran/pemasukan tanpa nama dompet di akhir akan otomatis menggunakan dompet ini.`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Gagal mengubah dompet utama: ${err.message}`);
  }
}

// 3. /tambah_dompet <nama> <tipe> [saldo_awal]
export async function handleTambahDompet(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const parts = match.trim().split(/\s+/);
  if (parts.length < 2) {
    await ctx.reply(
      `Format salah!\n*Penggunaan:* \`/tambah_dompet <nama> <tipe: cash|bank|ewallet> [saldo]\`\n*Contoh:* \`/tambah_dompet BCA bank 2000000\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const name = parts[0];
  const type = parts[1].toLowerCase();
  const balanceRaw = parts[2] ? parts[2].replace(/[^0-9]/g, "") : "0";
  const balance = parseFloat(balanceRaw) || 0;

  if (!["cash", "bank", "ewallet"].includes(type)) {
    await ctx.reply("Tipe dompet harus salah satu dari: `cash`, `bank`, atau `ewallet`", {
      parse_mode: "Markdown",
    });
    return;
  }

  try {
    const acc = await createAccount({
      userId: user.id,
      name,
      type,
      balance,
    });

    await ctx.reply(
      `✅ *Dompet baru berhasil dibuat!*\n\n` +
        `• Nama: *${acc.name}*\n` +
        `• Tipe: *${acc.type}*\n` +
        `• Saldo Awal: *${formatRupiah(acc.balance)}*`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Gagal membuat dompet: ${err.message}`);
  }
}

// 4. /catat <in|out> <nominal> <keterangan> [dompet]
export async function handleCatat(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const parts = match.trim().split(/\s+/);
  if (parts.length < 3) {
    await ctx.reply(
      `Format salah!\n*Penggunaan:* \`/catat <in|out> <nominal> <keterangan> [dompet]\`\n*Contoh:* \`/catat out 25k bensin vario cash\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const typeRaw = parts[0].toLowerCase();
  const type: "income" | "expense" =
    typeRaw === "in" || typeRaw === "income" || typeRaw === "masuk" ? "income" : "expense";

  // Parse nominal (support e.g. 25000, 25k, 25rb, 1.5jt)
  const nominalStr = parts[1].toLowerCase();
  let amount = 0;
  if (nominalStr.endsWith("jt") || nominalStr.endsWith("m") || nominalStr.endsWith("juta")) {
    amount = parseFloat(nominalStr.replace(/(jt|m|juta)/, "")) * 1000000;
  } else if (nominalStr.endsWith("rb") || nominalStr.endsWith("k") || nominalStr.endsWith("ribu")) {
    amount = parseFloat(nominalStr.replace(/(rb|k|ribu)/, "")) * 1000;
  } else {
    amount = parseFloat(nominalStr.replace(/[^0-9.]/g, ""));
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    await ctx.reply("Nominal tidak valid. Masukkan angka nominal yang benar.");
    return;
  }

  const rawText = parts.slice(2).join(" ");

  // Ambil daftar dompet user
  const accountsList = await getUserAccounts(user.id);
  if (accountsList.length === 0) {
    await ctx.reply("Kamu belum memiliki dompet. Ketik /start terlebih dahulu.");
    return;
  }

  // Pisahkan secara cermat keterangan transaksi dan dompet di akhir string
  const { wallet, description } = extractWalletAndDescription(rawText, accountsList);

  // Cari kategori yang sesuai secara pintar
  const allCategories = await getCategories(user.id);
  const matchedCategory = findMatchingCategory(description, type, allCategories);

  try {
    const res = await createTransaction({
      userId: user.id,
      accountId: wallet.id,
      categoryId: matchedCategory.id,
      amount,
      type,
      note: description,
      source: "telegram",
    });

    const icon = type === "income" ? "🟢 ➕" : "🔴 ➖";
    await ctx.reply(
      `${icon} *Transaksi Berhasil Dicatat!*\n\n` +
        `• Tipe: *${type === "income" ? "Pemasukan" : "Pengeluaran"}*\n` +
        `• Keterangan: *${description}*\n` +
        `• Kategori: ${matchedCategory.icon || "🏷️"} *${matchedCategory.name}*\n` +
        `• Nominal: *${formatRupiah(amount)}*\n` +
        `• Sumber Dompet: 💼 *${wallet.name}*\n` +
        `• Sisa Saldo: *${formatRupiah(res.updatedAccount.balance)}*`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Gagal mencatat transaksi: ${err.message}`);
  }
}

// 5. /alokasi (Cek status alokasi dana dengan range waktu)
export async function handleAlokasi(ctx: Context) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const budgetList = await getUserBudgets(user.id);

  if (budgetList.length === 0) {
    await ctx.reply(
      `🎯 *Belum ada Alokasi Dana (Budget)*\n\n` +
        `Kamu bisa membuat alokasi pengeluaran bulanan atau mingguan agar keuangan lebih terkontrol.\n\n` +
        `*Cara Buat:* \`/tambah_alokasi <nama> <target> <kategori> [hari]\`\n` +
        `*Contoh:* \`/tambah_alokasi Makan-Bulanan 1500000 Makan & Minum 30\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  let text = `🎯 *Status Alokasi Dana (${user.fullName}):*\n\n`;

  for (const b of budgetList) {
    const statusIcon = b.isActive ? "🟢 Aktif" : "⚪ Berakhir";
    const progBar = makeProgressBar(b.percentageUsed);

    text +=
      `📌 *${b.name || b.category?.name || "Alokasi Dana"}* (${statusIcon})\n` +
      `  • Kategori: ${b.category?.icon || "🏷️"} ${b.category?.name || "-"}\n` +
      `  • Periode: \`${b.periodStart}\` s/d \`${b.periodEnd}\`\n` +
      `  • Target: *${formatRupiah(b.amountLimit)}*\n` +
      `  • Terpakai: *${formatRupiah(b.spentAmount)}*\n` +
      `  • Sisa: *${formatRupiah(b.remainingAmount)}*\n` +
      `  • Progress: ${progBar}\n\n`;
  }

  await ctx.reply(text, { parse_mode: "Markdown" });
}

// 6. /tambah_alokasi <nama> <target> <nama_kategori> [hari]
export async function handleTambahAlokasi(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const parts = match.trim().split(/\s+/);
  if (parts.length < 3) {
    await ctx.reply(
      `Format salah!\n*Penggunaan:* \`/tambah_alokasi <nama> <target_nominal> <kategori> [jumlah_hari: default 30]\`\n*Contoh:* \`/tambah_alokasi Makan-Oktober 1500000 Makan 30\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const name = parts[0];
  const amountLimit = parseFloat(parts[1].replace(/[^0-9]/g, "")) || 0;
  const categoryKeyword = parts[2].toLowerCase();
  const durationDays = parts[3] ? parseInt(parts[3], 10) : 30;

  if (amountLimit <= 0) {
    await ctx.reply("Nominal target alokasi harus lebih dari 0.");
    return;
  }

  const allCategories = await getCategories(user.id);
  const cat = allCategories.find((c) =>
    c.name.toLowerCase().includes(categoryKeyword) && c.type === "expense"
  );

  if (!cat) {
    await ctx.reply(
      `Kategori "${categoryKeyword}" tidak ditemukan. Ketik /kategori untuk melihat nama-nama kategori pengeluaran.`
    );
    return;
  }

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + durationDays);

  const periodStart = today.toISOString().split("T")[0];
  const periodEnd = endDate.toISOString().split("T")[0];

  try {
    const newBudget = await createBudget({
      userId: user.id,
      categoryId: cat.id,
      name,
      amountLimit,
      periodStart,
      periodEnd,
    });

    await ctx.reply(
      `🎯 *Alokasi Dana Berhasil Dibuat!*\n\n` +
        `• Nama: *${newBudget.name}*\n` +
        `• Kategori: ${cat.icon || "🏷️"} *${cat.name}*\n` +
        `• Batas Anggaran: *${formatRupiah(amountLimit)}*\n` +
        `• Rentang Periode: \`${periodStart}\` s/d \`${periodEnd}\` (${durationDays} hari)\n\n` +
        `Ketik /alokasi untuk memantau pemakaiannya.`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Gagal membuat alokasi: ${err.message}`);
  }
}

// 7. /riwayat [limit]
export async function handleRiwayat(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const limit = match ? parseInt(match.trim(), 10) || 5 : 5;
  const txList = await getUserTransactions(user.id, { limit: Math.min(20, limit) });

  if (txList.length === 0) {
    await ctx.reply("Belum ada riwayat transaksi. Ketik /catat untuk mencatat transaksi pertama.");
    return;
  }

  let text = `📜 *${txList.length} Transaksi Terakhir:*\n\n`;

  for (const tx of txList) {
    const sign = tx.type === "income" ? "🟢 +" : "🔴 -";
    text +=
      `${sign} *${formatRupiah(tx.amount)}* — ${tx.note || tx.category?.name || "Transaksi"}\n` +
      `   _🏷️ ${tx.category?.icon || ""} ${tx.category?.name || ""} • 💼 ${tx.account?.name || ""} • 📅 ${tx.transactionDate}_\n\n`;
  }

  await ctx.reply(text, { parse_mode: "Markdown" });
}

// 8. /kategori
export async function handleKategori(ctx: Context) {
  const user = await getTelegramUser(ctx);
  const catList = await getCategories(user?.id);

  const expense = catList.filter((c) => c.type === "expense");
  const income = catList.filter((c) => c.type === "income");

  const text =
    `🏷️ *Daftar Kategori Transaksi*\n\n` +
    `💸 *Pengeluaran:*\n` +
    expense.map((c) => `• ${c.icon || "•"} ${c.name}`).join("\n") +
    `\n\n💰 *Pemasukan:*\n` +
    income.map((c) => `• ${c.icon || "•"} ${c.name}`).join("\n");

  await ctx.reply(text, { parse_mode: "Markdown" });
}

// 9. /utang
export async function handleUtang(ctx: Context) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const debtList = await getUserDebts(user.id, false); // hanya yang belum lunas

  if (debtList.length === 0) {
    await ctx.reply(
      `🤝 *Tidak Ada Utang / Piutang Aktif!*\n\n` +
        `Semua utang dan piutang telah lunas atau belum dicatat.\n\n` +
        `*Cara Catat:* \`/tambah_utang <nama_orang> <nominal> <utang|piutang> [keterangan]\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  let text = `🤝 *Daftar Utang & Piutang Aktif:*\n\n`;

  debtList.forEach((d, idx) => {
    const isUtang = d.type === "owed_by_me";
    const tag = isUtang ? "🔴 Utang Kita ke:" : "🟢 Piutang dari:";
    text +=
      `*#${idx + 1}* ${tag} *${d.contactName}*\n` +
      `  • Nominal: *${formatRupiah(d.amount)}*\n` +
      `  • Catatan: ${d.note || "-"}\n` +
      `  • Untuk lunas: \`/lunas ${idx + 1}\`\n\n`;
  });

  await ctx.reply(text, { parse_mode: "Markdown" });
}

// 10. /tambah_utang <nama_orang> <nominal> <utang|piutang> [catatan]
export async function handleTambahUtang(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const parts = match.trim().split(/\s+/);
  if (parts.length < 3) {
    await ctx.reply(
      `Format salah!\n*Penggunaan:* \`/tambah_utang <nama_orang> <nominal> <utang|piutang> [catatan]\`\n*Contoh:* \`/tambah_utang Budi 150000 piutang pinjam bayar makan\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const contactName = parts[0];
  const amount = parseFloat(parts[1].replace(/[^0-9]/g, "")) || 0;
  const typeRaw = parts[2].toLowerCase();
  const type: "owed_by_me" | "owed_to_me" =
    typeRaw === "utang" || typeRaw === "owed_by_me" ? "owed_by_me" : "owed_to_me";
  const note = parts.slice(3).join(" ") || null;

  if (amount <= 0) {
    await ctx.reply("Nominal harus lebih dari 0.");
    return;
  }

  try {
    const newDebt = await createDebt({
      userId: user.id,
      contactName,
      amount,
      type,
      note: note || undefined,
    });

    const label = type === "owed_by_me" ? "Utang (Kamu Berutang)" : "Piutang (Orang Berutang)";
    await ctx.reply(
      `✅ *Catatan Berhasil Disimpan!*\n\n` +
        `• Tipe: *${label}*\n` +
        `• Orang: *${newDebt.contactName}*\n` +
        `• Nominal: *${formatRupiah(newDebt.amount)}*\n` +
        `• Catatan: ${newDebt.note || "-"}\n\n` +
        `Ketik /utang untuk melihat status catatan ini.`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Gagal mencatat: ${err.message}`);
  }
}

// 11. /lunas <nomor_urut>
export async function handleLunasUtang(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const index = parseInt(match.trim(), 10);
  if (isNaN(index) || index <= 0) {
    await ctx.reply("Format salah. Ketik /utang untuk melihat nomor urut utang, lalu ketik `/lunas <nomor>`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const debtList = await getUserDebts(user.id, false);
  const target = debtList[index - 1];

  if (!target) {
    await ctx.reply(`Nomor #${index} tidak ditemukan di daftar utang aktif. Ketik /utang untuk melihat list.`);
    return;
  }

  try {
    await settleDebt(target.id, user.id);
    await ctx.reply(
      `🎉 *Catatan Diselesaikan (Lunas)!*\n\n` +
        `• Kontak: *${target.contactName}*\n` +
        `• Nominal: *${formatRupiah(target.amount)}* telah ditandai lunas.`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    await ctx.reply(`❌ Gagal menandai lunas: ${err.message}`);
  }
}

// 12. /help
export async function handleHelp(ctx: Context) {
  await ctx.reply(getHelpMessage(), { parse_mode: "Markdown" });
}

// 13. Smart Natural Text Parser (misal: "-25k bensin vario cash" atau "kopi 25rb")
export async function handleSmartText(ctx: Context) {
  const text = ctx.message?.text?.trim();
  if (!text || text.startsWith("/")) return;

  // Cek apakah mengandung angka / nominal
  const pattern = /(-|\+)?\s*(\d+[.,]?\d*)\s*(rb|k|jt|m|ribu|juta)?/i;
  const match = text.match(pattern);

  if (!match) {
    await ctx.reply(
      `Pesan diterima: "${text}"\n\n💡 *Tip Catat Cepat:* Ketik nominal, keterangan, dan opsional dompet di akhir kata, contoh:\n👉 \`-25k bensin vario cash\`\n👉 \`-35k makan siang gopay\`\n👉 \`+5jt gaji bulanan bca\`\n\nKetik /help untuk panduan lengkap.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const sign = match[1];
  const numRaw = match[2].replace(",", ".");
  const unit = match[3]?.toLowerCase();

  let amount = parseFloat(numRaw);
  if (unit === "rb" || unit === "k" || unit === "ribu") {
    amount *= 1000;
  } else if (unit === "jt" || unit === "m" || unit === "juta") {
    amount *= 1000000;
  }

  if (amount <= 0 || isNaN(amount)) return;

  const isIncome =
    sign === "+" ||
    text.toLowerCase().includes("gaji") ||
    text.toLowerCase().includes("transfer masuk") ||
    text.toLowerCase().includes("bonus");
  const type: "income" | "expense" = isIncome ? "income" : "expense";

  // Ambil sisa teks selain nominal (keterangan + opsional dompet)
  const rawText = text.replace(match[0], "").trim() || (type === "income" ? "Pemasukan" : "Pengeluaran");

  // Call handleCatat logic
  await handleCatat(ctx, `${type === "income" ? "in" : "out"} ${amount} ${rawText}`);
}

// 14. /reset (Wipeout Data - Langkah 1/2)
export async function handleReset(ctx: Context) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  await ctx.reply(
    `⚠️ *PERINGATAN KERAS: RESET & HAPUS TOTAL DATA (Langkah 1/2)*\n\n` +
      `Tindakan ini akan menghapus *SEMUA* data keuanganmu secara permanen:\n` +
      `❌ Semua riwayat transaksi\n` +
      `❌ Semua dompet & saldo\n` +
      `❌ Semua alokasi anggaran (budget)\n` +
      `❌ Semua catatan utang & piutang\n` +
      `❌ Profil akun kamu di sistem\n\n` +
      `Data yang sudah dihapus *TIDAK BISA DIKEMBALIKAN*.\n` +
      `Setelah di-reset, kamu akan kembali ke posisi awal (harus onboarding lagi lewat /start).\n\n` +
      `Jika kamu *BENAR-BENAR YAKIN*, lanjutkan ke langkah berikutnya dengan mengetik perintah berikut:\n` +
      `👉 \`/reset_konfirmasi SAYA_YAKIN_HAPUS_SEMUA\``,
    { parse_mode: "Markdown" }
  );
}

// 14b. /reset_konfirmasi <kode> (Wipeout Data - Langkah 2/2)
export async function handleResetKonfirmasi(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const code = match ? match.trim() : "";
  if (code !== "SAYA_YAKIN_HAPUS_SEMUA") {
    await ctx.reply(
      `❌ *Kode Konfirmasi Salah!*\n\n` +
        `Proses reset dibatalkan demi keamanan.\n` +
        `Jika ingin mereset, ketik persis:\n\`/reset_konfirmasi SAYA_YAKIN_HAPUS_SEMUA\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  await ctx.reply(
    `🚨 *KONFIRMASI TERAKHIR SEBELUM EKSEKUSI (Langkah 2/2)*\n\n` +
      `Apakah kamu yakin 100% ingin menghapus seluruh data akun *${user.fullName}* sekarang juga?\n\n` +
      `Ketik perintah di bawah ini untuk langsung mengeksekusi penghapusan:\n` +
      `👉 \`/reset_final HAPUS_SEKARANG\``,
    { parse_mode: "Markdown" }
  );
}

// 14c. /reset_final <kode> (Wipeout Eksekusi)
export async function handleResetFinal(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) {
    await ctx.reply("Akunmu sudah tidak terdaftar.");
    return;
  }

  const code = match ? match.trim() : "";
  if (code !== "HAPUS_SEKARANG") {
    await ctx.reply(
      `❌ *Eksekusi Dibatalkan!*\nKode verifikasi terakhir tidak sesuai. Seluruh datamu tetap aman tersimpan.`
    );
    return;
  }

  try {
    await wipeoutUserData(user.id);
    await ctx.reply(
      `💥 *WIPEOUT BERHASIL! SEMUA DATA TELAH DIHAPUS.*\n\n` +
        `Seluruh data transaksi, saldo dompet, alokasi anggaran, dan profil akunmu telah dihapus bersih dari database.\n\n` +
        `Kamu sekarang berada di status awal (sebelum onboarding).\n` +
        `Ketik /start kapan saja untuk memulai onboarding akun baru!`,
      { parse_mode: "Markdown" }
    );
  } catch (err: any) {
    console.error("Gagal wipeout:", err);
    await ctx.reply(`❌ Terjadi kesalahan saat menghapus data: ${err.message}`);
  }
}
