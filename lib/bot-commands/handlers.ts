import { Context } from "grammy";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { onboardUser } from "@/lib/onboarding";
import {
  getUserAccounts,
  createAccount,
  setDefaultAccount,
  transferBetweenAccounts,
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

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function formatRupiah(amount: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

/**
 * Helper untuk mem-parsing nominal angka dari input teks/command.
 * Mendukung:
 * - 25 -> 25
 * - 25k, 25 k, 25rb, 25 rb, 25ribu -> 25.000
 * - 25m, 25 m, 25jt, 25 jt, 25juta -> 25.000.000
 * - 25.000 atau 1.500.000 (titik sebagai pemisah ribuan) -> 25.000 / 1.500.000
 * - 1.5jt, 1,5jt, 2.5k -> 1.500.000 / 2.500
 */
export function parseNominal(raw: string): number {
  const clean = raw.trim().toLowerCase();

  // Unit di akhir kata: rb, k, jt, m, ribu, juta
  const unitMatch = clean.match(/^([0-9.,]+)\s*(rb|k|jt|m|ribu|juta)$/i);
  if (unitMatch) {
    const numStr = unitMatch[1].replace(",", ".");
    let amt = parseFloat(numStr);
    const unit = unitMatch[2].toLowerCase();
    if (unit === "rb" || unit === "k" || unit === "ribu") {
      amt *= 1000;
    } else if (unit === "jt" || unit === "m" || unit === "juta") {
      amt *= 1000000;
    }
    return isNaN(amt) ? 0 : amt;
  }

  let numStr = clean;
  // Cek format ribuan Indonesia dengan titik: 25.000 atau 1.500.000
  if (/^\d{1,3}(\.\d{3})+$/.test(numStr)) {
    numStr = numStr.replace(/\./g, "");
  } else {
    numStr = numStr.replace(",", ".");
  }

  const amt = parseFloat(numStr);
  return isNaN(amt) ? 0 : amt;
}

const TYPE_ICONS: Record<string, string> = {
  cash: "💵",
  bank: "🏦",
  ewallet: "📱",
};

function makeProgressBar(percentage: number): string {
  const total = 8;
  const clamped = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((clamped / 100) * total);
  const empty = total - filled;
  return `▰`.repeat(filled) + `▱`.repeat(empty) + ` ${percentage}%`;
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

export function parseTransferParams<T extends { id: string; name: string; type: string }>(
  match: string,
  accounts: T[]
): { amount: number; fromAccount: T; toAccount: T; note: string } | { error: string } | null {
  const text = match.replace(/^dari\s+/i, "").trim();
  const parts = text.split(/\s+/);
  if (parts.length < 3) return null;

  const nominalStr = parts[0];
  const amount = parseNominal(nominalStr);
  if (amount <= 0 || isNaN(amount)) return null;

  const rest = parts.slice(1).join(" ");

  // Cek apakah ada pemisah 'ke' atau '->'
  const keMatch = rest.match(/^(.*?)\s+(?:ke|->)\s+(.*)$/i);
  let fromCandidate = "";
  let toAndNote = "";

  if (keMatch) {
    fromCandidate = keMatch[1].replace(/^dari\s+/i, "").trim();
    toAndNote = keMatch[2].trim();
  } else {
    const words = rest.split(/\s+/);
    fromCandidate = words[0];
    toAndNote = words.slice(1).join(" ");
  }

  const fromAccount = accounts.find((a) => matchesAccount(fromCandidate, a));
  if (!fromAccount) {
    return { error: `Dompet asal "${fromCandidate}" tidak ditemukan.` };
  }

  const toWords = toAndNote.split(/\s+/);
  let toAccount: T | null = null;
  let note = "";

  for (let len = Math.min(3, toWords.length); len >= 1; len--) {
    const cand = toWords.slice(0, len).join(" ");
    const matched = accounts.find((a) => a.id !== fromAccount.id && matchesAccount(cand, a));
    if (matched) {
      toAccount = matched;
      note = toWords.slice(len).join(" ");
      break;
    }
  }

  if (!toAccount) {
    return { error: `Dompet tujuan "${toAndNote}" tidak ditemukan.` };
  }

  return { amount, fromAccount, toAccount, note };
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
    .map((acc) => {
      const icon = TYPE_ICONS[acc.type] || "💳";
      return `${icon} *${acc.name}*\n└ \`${formatRupiah(acc.balance)}\``;
    })
    .join("\n\n");

  if (result.isNewUser) {
    await ctx.reply(
      `🎉 *Selamat Datang di Fana!*\n` +
        `👤 *${result.user.fullName}*\n` +
        `───────────────────\n` +
        `💼 *Dompet Keuangan Siap Pakai:*\n\n` +
        `${walletList}\n` +
        `───────────────────\n` +
        `💡 Ketik /help untuk melihat panduan lengkap.`,
      { parse_mode: "Markdown" }
    );
  } else {
    await ctx.reply(
      `👋 *Halo Kembali, ${result.user.fullName}!*\n` +
        `───────────────────\n` +
        `💼 *Status Dompet:*\n\n` +
        `${walletList}\n` +
        `───────────────────\n` +
        `💡 Ketik /saldo untuk cek saldo atau langsung catat transaksi.`,
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
      const icon = TYPE_ICONS[a.type] || "💳";
      const isDef = a.isDefault ? " ⭐ _(Utama)_" : "";
      return `${icon} *#${idx + 1} ${a.name}*${isDef}\n└ Saldo: \`${formatRupiah(a.balance)}\``;
    })
    .join("\n\n");

  await ctx.reply(
    `💰 *DOMPET & SALDO*\n` +
      `👤 *${user.fullName}*\n` +
      `───────────────────\n` +
      `${rows}\n` +
      `───────────────────\n` +
      `📊 *Total Saldo:* \`${formatRupiah(total)}\`\n\n` +
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
        const icon = TYPE_ICONS[a.type] || "💳";
        const isDef = a.isDefault ? " ⭐ _(Saat ini utama)_" : "";
        return `${icon} *#${idx + 1} ${a.name}*${isDef}\n└ Saldo: \`${formatRupiah(a.balance)}\``;
      })
      .join("\n\n");

    await ctx.reply(
      `💼 *PILIH DOMPET UTAMA*\n` +
        `───────────────────\n` +
        `Dompet utama otomatis terpakai jika saat mencatat tidak menyebutkan dompet.\n\n` +
        `${rows}\n` +
        `───────────────────\n` +
        `💡 *Cara Ganti:* \`/dompet_utama <nomor/nama>\`\n` +
        `_Contoh:_ \`/dompet_utama 2\` atau \`/dompet_utama mandiri\``,
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
    const icon = TYPE_ICONS[updated.type] || "💳";
    await ctx.reply(
      `⭐ *Dompet Utama Berhasil Diubah!*\n` +
        `───────────────────\n` +
        `${icon} *${updated.name}*\n` +
        `└ Saldo: \`${formatRupiah(updated.balance)}\`\n` +
        `───────────────────\n` +
        `_Transaksi tanpa dompet akan otomatis menggunakan dompet ini._`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal mengubah dompet utama: ${getErrorMessage(err)}`);
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
  const balanceRaw = parts[2] ? parts[2].trim() : "0";
  const balance = parseNominal(balanceRaw);

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

    const icon = TYPE_ICONS[acc.type] || "💳";
    await ctx.reply(
      `✅ *Dompet Baru Berhasil Dibuat!*\n` +
        `───────────────────\n` +
        `${icon} *${acc.name}* (${acc.type})\n` +
        `└ Saldo Awal: \`${formatRupiah(acc.balance)}\``,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal membuat dompet: ${getErrorMessage(err)}`);
  }
}

// 3b. /transfer atau /tf <nominal> <dari_dompet> [ke] <ke_dompet> [catatan]
export async function handleTransfer(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const accountsList = await getUserAccounts(user.id);
  if (accountsList.length < 2) {
    await ctx.reply(
      "Kamu membutuhkan minimal 2 dompet untuk melakukan transfer. Ketik /tambah_dompet untuk membuat dompet baru."
    );
    return;
  }

  const parsed = parseTransferParams(match, accountsList);
  if (!parsed) {
    await ctx.reply(
      `Format salah!\n*Penggunaan:* \`/tf <nominal> <dompet_asal> [ke] <dompet_tujuan> [catatan]\`\n*Contoh:*\n👉 \`/tf 500k mandiri cash\`\n👉 \`/tf 100k bca ke gopay topup ewallet\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  if ("error" in parsed) {
    await ctx.reply(`❌ ${parsed.error}`);
    return;
  }

  const { amount, fromAccount, toAccount, note } = parsed;

  try {
    const res = await transferBetweenAccounts({
      userId: user.id,
      fromAccountId: fromAccount.id,
      toAccountId: toAccount.id,
      amount,
      note,
      source: "telegram",
    });

    await ctx.reply(
      `🔁 *Transfer Antar Dompet Berhasil!*\n` +
        `───────────────────\n` +
        `💰 Nominal : \`${formatRupiah(res.amount)}\`\n` +
        `📤 Dari    : *${res.fromAccount.name}*\n` +
        `   └ Sisa  : \`${formatRupiah(res.fromAccount.balance)}\`\n` +
        `📥 Ke      : *${res.toAccount.name}*\n` +
        `   └ Saldo : \`${formatRupiah(res.toAccount.balance)}\`\n` +
        (note ? `📝 Catatan : _${note}_\n` : "") +
        `───────────────────\n` +
        `_Mutasi internal (total aset tidak berubah)._`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal melakukan transfer: ${getErrorMessage(err)}`);
  }
}

// 3c. /tarik <nominal> [dari_dompet] [catatan]
export async function handleTarikTunai(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const accountsList = await getUserAccounts(user.id);
  const cashAccount = accountsList.find((a) => a.type === "cash");
  if (!cashAccount) {
    await ctx.reply(
      "Dompet tunai (Cash) tidak ditemukan. Ketik /tambah_dompet untuk membuat dompet bertipe cash."
    );
    return;
  }

  const parts = match.trim().split(/\s+/);
  if (!parts[0]) {
    await ctx.reply(
      `Format salah!\n*Penggunaan:* \`/tarik <nominal> [dompet_bank] [catatan]\`\n*Contoh:* \`/tarik 500k mandiri\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const amount = parseNominal(parts[0]);
  if (amount <= 0 || isNaN(amount)) {
    await ctx.reply("Nominal penarikan tidak valid. Masukkan angka nominal yang benar.");
    return;
  }

  const nonCashAccounts = accountsList.filter((a) => a.id !== cashAccount.id);
  if (nonCashAccounts.length === 0) {
    await ctx.reply("Kamu belum memiliki rekening bank / e-wallet untuk ditarik saldonya.");
    return;
  }

  let fromAccount = nonCashAccounts[0];
  let note = "Tarik tunai ATM";

  if (parts.length > 1) {
    const candidateName = parts[1];
    const found = nonCashAccounts.find((a) => matchesAccount(candidateName, a));
    if (found) {
      fromAccount = found;
      if (parts.length > 2) {
        note = parts.slice(2).join(" ");
      }
    } else {
      note = parts.slice(1).join(" ");
    }
  }

  try {
    const res = await transferBetweenAccounts({
      userId: user.id,
      fromAccountId: fromAccount.id,
      toAccountId: cashAccount.id,
      amount,
      note,
      source: "telegram",
    });

    await ctx.reply(
      `💵 *Penarikan Tunai Berhasil!*\n` +
        `───────────────────\n` +
        `💰 Nominal : \`${formatRupiah(res.amount)}\`\n` +
        `🏦 Dari    : *${res.fromAccount.name}*\n` +
        `   └ Sisa  : \`${formatRupiah(res.fromAccount.balance)}\`\n` +
        `💵 Masuk ke: *${res.toAccount.name}*\n` +
        `   └ Saldo : \`${formatRupiah(res.toAccount.balance)}\`\n` +
        `📝 Catatan : _${note}_`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal tarik tunai: ${getErrorMessage(err)}`);
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

  // Parse nominal (support e.g. 25, 25000, 25k, 25rb, 25.000, 1.5jt)
  const nominalStr = parts[1].toLowerCase();
  const amount = parseNominal(nominalStr);

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

    const isInc = type === "income";
    const statusIcon = isInc ? "🟢" : "🔴";
    const typeLabel = isInc ? "Pemasukan Dicatat" : "Pengeluaran Dicatat";
    await ctx.reply(
      `${statusIcon} *${typeLabel}*\n` +
        `───────────────────\n` +
        `📝 *${description}*\n` +
        `💰 Nominal  : \`${formatRupiah(amount)}\`\n` +
        `🏷️ Kategori : ${matchedCategory.icon || "🏷️"} ${matchedCategory.name}\n` +
        `💼 Dompet   : ${wallet.name}\n` +
        `   └ Sisa   : \`${formatRupiah(res.updatedAccount.balance)}\``,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal mencatat transaksi: ${getErrorMessage(err)}`);
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

  let text = `🎯 *STATUS ALOKASI DANA*\n👤 *${user.fullName}*\n───────────────────\n\n`;

  for (const b of budgetList) {
    const statusIcon = b.isActive ? "🟢 Aktif" : "⚪ Berakhir";
    const progBar = makeProgressBar(b.percentageUsed);

    text +=
      `📌 *${b.name || b.category?.name || "Alokasi"}* (${statusIcon})\n` +
      `   ${b.category?.icon || "🏷️"} ${b.category?.name || "-"} • \`${b.periodStart}\` s/d \`${b.periodEnd}\`\n` +
      `   ${progBar}\n` +
      `   └ Terpakai: \`${formatRupiah(b.spentAmount)}\` / \`${formatRupiah(b.amountLimit)}\`\n` +
      `   └ Sisa    : \`${formatRupiah(b.remainingAmount)}\`\n\n`;
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
  const amountLimit = parseNominal(parts[1]);
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
      `🎯 *Alokasi Dana Berhasil Dibuat!*\n` +
        `───────────────────\n` +
        `📌 *${newBudget.name}*\n` +
        `🏷️ Kategori : ${cat.icon || "🏷️"} ${cat.name}\n` +
        `🎯 Target   : \`${formatRupiah(amountLimit)}\`\n` +
        `📅 Periode  : \`${periodStart}\` s/d \`${periodEnd}\` (${durationDays} hari)\n` +
        `───────────────────\n` +
        `_Pantau pemakaian dengan perintah /alokasi_`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal membuat alokasi: ${getErrorMessage(err)}`);
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

  let text = `📜 *${txList.length} TRANSAKSI TERAKHIR*\n───────────────────\n\n`;

  for (const tx of txList) {
    const sign = tx.type === "income" ? "🟢 +" : "🔴 -";
    const partsDate = (tx.transactionDate || "").split("-");
    const dateFormatted = partsDate.length === 3 ? `${partsDate[2]}/${partsDate[1]}` : tx.transactionDate;
    const catIcon = tx.category?.icon || "🏷️";
    const title = tx.note || tx.category?.name || "Transaksi";

    text +=
      `${sign} *${title}*\n` +
      `└ \`${formatRupiah(tx.amount)}\` • ${catIcon} ${tx.account?.name || ""} (${dateFormatted})\n\n`;
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
    `🏷️ *DAFTAR KATEGORI TRANSAKSI*\n` +
    `───────────────────\n\n` +
    `💸 *PENGELUARAN:*\n` +
    expense.map((c) => `• ${c.icon || "•"} ${c.name}`).join("\n") +
    `\n\n💰 *PEMASUKAN:*\n` +
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

  let text = `🤝 *DAFTAR UTANG & PIUTANG AKTIF*\n───────────────────\n\n`;

  debtList.forEach((d, idx) => {
    const isUtang = d.type === "owed_by_me";
    const icon = isUtang ? "🔴" : "🟢";
    const label = isUtang ? "Utang ke" : "Piutang dari";
    text +=
      `${icon} *#${idx + 1} ${label} ${d.contactName}*\n` +
      `└ Nominal: \`${formatRupiah(d.amount)}\`\n` +
      `└ Catatan: ${d.note || "-"}\n` +
      `└ Tandai lunas: \`/lunas ${idx + 1}\`\n\n`;
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
  const amount = parseNominal(parts[1]);
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

    const isUtang = type === "owed_by_me";
    const tag = isUtang ? "🔴 Utang Kita ke:" : "🟢 Piutang dari:";
    await ctx.reply(
      `✅ *Catatan Berhasil Disimpan!*\n` +
        `───────────────────\n` +
        `👤 ${tag} *${newDebt.contactName}*\n` +
        `💰 Nominal: \`${formatRupiah(newDebt.amount)}\`\n` +
        `📝 Catatan: ${newDebt.note || "-"}\n` +
        `───────────────────\n` +
        `_Ketik /utang untuk melihat daftar catatan aktif._`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal mencatat: ${getErrorMessage(err)}`);
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
      `🎉 *Catatan Diselesaikan (Lunas)!*\n` +
        `───────────────────\n` +
        `👤 Kontak : *${target.contactName}*\n` +
        `💰 Nominal: \`${formatRupiah(target.amount)}\`\n` +
        `───────────────────\n` +
        `_Status telah ditandai lunas._`,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    await ctx.reply(`❌ Gagal menandai lunas: ${getErrorMessage(err)}`);
  }
}

// 12. /help
export async function handleHelp(ctx: Context) {
  await ctx.reply(getHelpMessage(), { parse_mode: "Markdown" });
}

// 13. Smart Natural Text Parser (misal: "-25k bensin vario cash" atau "tarik 500k mandiri")
export async function handleSmartText(ctx: Context) {
  const text = ctx.message?.text?.trim();
  if (!text || text.startsWith("/")) return;

  const lower = text.toLowerCase().trim();

  // 1. Deteksi intent Tarik Tunai (misal: "tarik tunai 500k mandiri", "tarik 500k mandiri")
  if (lower.startsWith("tarik") || lower.startsWith("tarik tunai")) {
    const stripped = text.replace(/^(tarik\s+tunai|tarik)\s+/i, "").trim();
    await handleTarikTunai(ctx, stripped);
    return;
  }

  // 2. Deteksi intent Transfer Antar Dompet (misal: "tf 500k mandiri ke cash", "transfer 100k bca ke gopay")
  if (lower.startsWith("tf ") || lower.startsWith("transfer ") || lower.startsWith("pindah ")) {
    const stripped = text.replace(/^(tf|transfer|pindah)\s+/i, "").trim();
    await handleTransfer(ctx, stripped);
    return;
  }

  // 3. Deteksi intent Top Up (misal: "topup 100k gopay dari bca", "topup 100k bca ke gopay")
  if (
    lower.startsWith("topup ") ||
    lower.startsWith("top up ") ||
    lower.startsWith("isi saldo ") ||
    lower.startsWith("isi ")
  ) {
    let clean = text.replace(/^(topup|top\s+up|isi\s+saldo|isi)\s+/i, "").trim();
    const pattern = /(\d+(?:[.,]\d+)*)\s*(?:(rb|k|jt|m|ribu|juta)(?![a-zA-Z]))?/i;
    const matchNominal = clean.match(pattern);
    if (matchNominal) {
      const nominalStr = matchNominal[0];
      clean = clean.replace(matchNominal[0], " ").trim().replace(/\s+/g, " ");
      if (/\bdari\b/i.test(clean)) {
        const parts = clean.split(/\bdari\b/i);
        const toCand = parts[0].trim();
        const fromCand = parts[1].trim();
        await handleTransfer(ctx, `${nominalStr} ${fromCand} ke ${toCand} topup`);
        return;
      } else if (/\bke\b/i.test(clean)) {
        const parts = clean.split(/\bke\b/i);
        const fromCand = parts[0].trim();
        const toCand = parts[1].trim();
        await handleTransfer(ctx, `${nominalStr} ${fromCand} ke ${toCand} topup`);
        return;
      } else {
        const words = clean.split(/\s+/);
        if (words.length >= 2) {
          const toCand = words[0];
          const fromCand = words[1];
          await handleTransfer(ctx, `${nominalStr} ${fromCand} ke ${toCand} topup`);
          return;
        }
      }
    }
  }

  // Cek apakah mengandung angka / nominal
  // Regex mencari:
  // 1. Tanda opsional (+ atau -)
  // 2. Angka: (\d+(?:[.,]\d+)*)
  // 3. Unit opsional: (rb|k|jt|m|ribu|juta) yang TIDAK diikuti oleh huruf [a-zA-Z]
  // Contoh:
  // "-25 makan" => unit tidak cocok karena 'm' diikuti 'akan' (huruf), sehingga nominal murni 25
  // "-25 keluar" => unit tidak cocok karena 'k' diikuti 'eluar' (huruf), sehingga nominal murni 25
  // "-25k bensin" => unit cocok 'k' karena diikuti spasi/bukan huruf, sehingga nominal 25.000
  const pattern = /(-|\+)?\s*(\d+(?:[.,]\d+)*)\s*(?:(rb|k|jt|m|ribu|juta)(?![a-zA-Z]))?/i;
  const match = text.match(pattern);

  if (!match) {
    await ctx.reply(
      `💬 *Pesan Diterima:* "${text}"\n` +
        `───────────────────\n` +
        `⚡ *Tip Catat Cepat (Tanpa Command):*\n` +
        `• \`-25k bensin vario cash\`\n` +
        `• \`-35k makan siang gopay\`\n` +
        `• \`+5jt gaji bulanan bca\`\n` +
        `• \`tarik tunai 500k mandiri\`\n` +
        `• \`tf 100k bca ke gopay\`\n\n` +
        `📖 Ketik /help untuk panduan lengkap.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const sign = match[1];
  const numRaw = match[2];
  const unit = match[3]?.toLowerCase();

  let amount = 0;
  if (unit) {
    const cleanNum = numRaw.replace(",", ".");
    amount = parseFloat(cleanNum);
    if (unit === "rb" || unit === "k" || unit === "ribu") {
      amount *= 1000;
    } else if (unit === "jt" || unit === "m" || unit === "juta") {
      amount *= 1000000;
    }
  } else {
    // Tanpa unit: e.g. "25", "25000", "25.000", "1.500.000"
    let cleanNum = numRaw;
    if (/^\d{1,3}(\.\d{3})+$/.test(cleanNum)) {
      cleanNum = cleanNum.replace(/\./g, "");
    } else {
      cleanNum = cleanNum.replace(",", ".");
    }
    amount = parseFloat(cleanNum);
  }

  if (amount <= 0 || isNaN(amount)) return;

  const isIncome =
    sign === "+" ||
    text.toLowerCase().includes("gaji") ||
    text.toLowerCase().includes("transfer masuk") ||
    text.toLowerCase().includes("bonus");
  const type: "income" | "expense" = isIncome ? "income" : "expense";

  // Ambil sisa teks selain nominal (keterangan + opsional dompet)
  const rawText =
    text.replace(match[0], " ").trim().replace(/\s+/g, " ") ||
    (type === "income" ? "Pemasukan" : "Pengeluaran");

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
  } catch (err) {
    console.error("Gagal wipeout:", err);
    await ctx.reply(`❌ Terjadi kesalahan saat menghapus data: ${getErrorMessage(err)}`);
  }
}
