"use server";

import { createTransaction } from "@/app/actions/transactions";
import { transferBetweenAccounts, getUserAccounts } from "@/app/actions/accounts";
import { getCategories } from "@/app/actions/categories";

export interface SmartInputResult {
  success: boolean;
  message: string;
  type: "income" | "expense" | "transfer";
  amount?: number;
  note?: string;
  accountName?: string;
  categoryName?: string;
  toAccountName?: string;
}

function parseNominal(raw: string): number {
  const clean = raw.trim().toLowerCase();

  // Unit suffixes: rb, k, jt, m, ribu, juta
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
  // Check Indonesian thousand separator formatting with dots: 25.000 or 1.500.000
  if (/^\d{1,3}(\.\d{3})+$/.test(numStr)) {
    numStr = numStr.replace(/\./g, "");
  } else {
    numStr = numStr.replace(",", ".");
  }

  const amt = parseFloat(numStr);
  return isNaN(amt) ? 0 : amt;
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

function extractWalletAndDescription<T extends { name: string; type: string; isDefault?: boolean }>(
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

function findMatchingCategory(
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

function parseTransferParams<T extends { id: string; name: string; type: string }>(
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
  let toCandidate = toWords[0];
  let note = toWords.slice(1).join(" ").trim();

  // Coba cari dompet tujuan (1 kata atau 2 kata)
  let toAccount = accounts.find((a) => matchesAccount(toCandidate, a));
  if (!toAccount && toWords.length >= 2) {
    const twoWords = `${toWords[0]} ${toWords[1]}`;
    const foundTwo = accounts.find((a) => matchesAccount(twoWords, a));
    if (foundTwo) {
      toAccount = foundTwo;
      note = toWords.slice(2).join(" ").trim();
    }
  }

  if (!toAccount) {
    return { error: `Dompet tujuan "${toCandidate}" tidak ditemukan.` };
  }

  if (fromAccount.id === toAccount.id) {
    return { error: "Dompet asal dan tujuan tidak boleh sama." };
  }

  return {
    amount,
    fromAccount,
    toAccount,
    note: note || "Transfer",
  };
}

export async function processSmartTextInput(data: {
  userId: string;
  familyId?: string | null;
  text: string;
}): Promise<SmartInputResult> {
  const { userId, familyId = null, text } = data;
  const rawText = text.trim();
  if (!rawText) {
    return {
      success: false,
      message: "Teks input tidak boleh kosong.",
      type: "expense",
    };
  }

  const lower = rawText.toLowerCase();

  // 1. Fetch user accounts and categories
  const [accountsList, allCategories] = await Promise.all([
    getUserAccounts(userId, familyId),
    getCategories(userId, familyId),
  ]);

  if (accountsList.length === 0) {
    return {
      success: false,
      message: "Kamu belum memiliki dompet/kantong. Silakan buat dompet terlebih dahulu di menu /kantong.",
      type: "expense",
    };
  }

  // 2. Intent: Transfer Antar Dompet (e.g. "tf 500k mandiri ke cash", "transfer 100k bca ke gopay")
  if (lower.startsWith("tf ") || lower.startsWith("transfer ") || lower.startsWith("pindah ")) {
    const stripped = rawText.replace(/^(tf|transfer|pindah)\s+/i, "").trim();
    const parsed = parseTransferParams(stripped, accountsList);
    if (!parsed) {
      return {
        success: false,
        message: "Format transfer tidak valid. Gunakan format: 'tf <nominal> <kantong_asal> ke <kantong_tujuan> [catatan]'. Contoh: 'tf 50k bca ke gopay topup'",
        type: "transfer",
      };
    }
    if ("error" in parsed) {
      return {
        success: false,
        message: parsed.error,
        type: "transfer",
      };
    }

    try {
      const res = await transferBetweenAccounts({
        userId,
        familyId,
        fromAccountId: parsed.fromAccount.id,
        toAccountId: parsed.toAccount.id,
        amount: parsed.amount,
        note: parsed.note || "Transfer via Smart Input",
        source: "web",
      });

      return {
        success: true,
        message: `Transfer berhasil! Rp ${parsed.amount.toLocaleString("id-ID")} dipindahkan dari ${res.fromAccount.name} ke ${res.toAccount.name}.`,
        type: "transfer",
        amount: parsed.amount,
        accountName: res.fromAccount.name,
        toAccountName: res.toAccount.name,
        note: parsed.note,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
        type: "transfer",
      };
    }
  }

  // 3. Intent: Tarik Tunai (e.g. "tarik tunai 500k mandiri", "tarik 200k bca")
  if (lower.startsWith("tarik") || lower.startsWith("tarik tunai")) {
    const stripped = rawText.replace(/^(tarik\s+tunai|tarik)\s+/i, "").trim();
    const cashAccount = accountsList.find((a) => a.type === "cash") || accountsList[0];
    const nonCashAccounts = accountsList.filter((a) => a.id !== cashAccount.id);

    const parts = stripped.split(/\s+/);
    const amount = parseNominal(parts[0]);
    if (!amount || amount <= 0) {
      return {
        success: false,
        message: "Nominal penarikan tidak valid.",
        type: "transfer",
      };
    }

    let fromAccount = nonCashAccounts[0] || accountsList[0];
    let note = "Tarik tunai ATM";

    if (parts.length > 1) {
      const candidateName = parts[1].toLowerCase();
      const found = nonCashAccounts.find(
        (a) => a.name.toLowerCase().includes(candidateName) || a.type.toLowerCase() === candidateName
      );
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
        userId,
        familyId,
        fromAccountId: fromAccount.id,
        toAccountId: cashAccount.id,
        amount,
        note,
        source: "web",
      });

      return {
        success: true,
        message: `Tarik tunai berhasil! Rp ${amount.toLocaleString("id-ID")} dari ${res.fromAccount.name} ke ${cashAccount.name}.`,
        type: "transfer",
        amount,
        accountName: res.fromAccount.name,
        toAccountName: cashAccount.name,
        note,
      };
    } catch (err: unknown) {
      return {
        success: false,
        message: err instanceof Error ? err.message : String(err),
        type: "transfer",
      };
    }
  }

  // 4. Intent: Catat Pemasukan / Pengeluaran Cepat
  // Regex mencari sign, nominal, unit
  const pattern = /(-|\+)?\s*(\d+(?:[.,]\d+)*)\s*(?:(rb|k|jt|m|ribu|juta)(?![a-zA-Z]))?/i;
  const match = rawText.match(pattern);

  if (!match) {
    return {
      success: false,
      message: "Format tidak dikenali. Coba ketik contoh: '-25k sayur cash', '+5jt gaji bca', atau 'tf 50k bca ke gopay'",
      type: "expense",
    };
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
    let cleanNum = numRaw;
    if (/^\d{1,3}(\.\d{3})+$/.test(cleanNum)) {
      cleanNum = cleanNum.replace(/\./g, "");
    } else {
      cleanNum = cleanNum.replace(",", ".");
    }
    amount = parseFloat(cleanNum);
  }

  if (amount <= 0 || isNaN(amount)) {
    return {
      success: false,
      message: "Nominal tidak valid atau harus lebih dari 0.",
      type: "expense",
    };
  }

  const isIncome =
    sign === "+" ||
    lower.includes("gaji") ||
    lower.includes("bonus") ||
    lower.includes("transfer masuk") ||
    lower.includes("income");

  const type: "income" | "expense" = isIncome ? "income" : "expense";

  // Remaining string after nominal
  const strippedText = rawText.replace(match[0], " ").trim().replace(/\s+/g, " ");
  const descriptionFallback = type === "income" ? "Pemasukan" : "Pengeluaran";
  const descWithWallet = strippedText || descriptionFallback;

  // Extract wallet from the end of description
  const { wallet, description } = extractWalletAndDescription(descWithWallet, accountsList);

  // Match category
  const matchedCategory = findMatchingCategory(description, type, allCategories);

  try {
    const res = await createTransaction({
      userId,
      familyId,
      accountId: wallet.id,
      categoryId: matchedCategory.id,
      amount,
      type,
      note: description,
      source: "web",
    });

    const actionText = type === "income" ? "Pemasukan" : "Pengeluaran";
    return {
      success: true,
      message: `${actionText} sebesar Rp ${amount.toLocaleString("id-ID")} (${description}) berhasil dicatat di kantong "${wallet.name}" [${matchedCategory.name}]!`,
      type,
      amount,
      note: description,
      accountName: wallet.name,
      categoryName: matchedCategory.name,
    };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
      type,
    };
  }
}
