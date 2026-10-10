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

export function parseNominal(raw: string): number {
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

export function normalizeText(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export const TYPE_ALIASES: Record<string, string[]> = {
  cash: ["cash", "tunai", "dompet", "fisik", "wallet"],
  bank: ["bank", "bca", "mandiri", "bri", "bni", "cimb", "jago", "jenius", "seabank", "rekening", "account"],
  ewallet: ["ewallet", "e-wallet", "gopay", "ovo", "dana", "shopeepay", "spay", "linkaja"],
};

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Makan & Minum": [
    "makan", "minum", "kopi", "coffee", "cafe", "kafe", "resto", "restaurant", "bakso",
    "mie", "nasi", "sarapan", "breakfast", "lunch", "dinner", "jajan", "snack", "teh", "tea", "boba", "ayam", "chicken", "padang", "food", "drink", "meal", "dining"
  ],
  "Transport": [
    "bensin", "bbm", "pertalite", "pertamax", "solar", "fuel", "gas", "petrol", "vario", "beat", "nmax", "pcx", "motor", "mobil", "car", "bike",
    "ojek", "gojek", "goride", "gocar", "grab", "grabfood", "maxim", "parkir", "parking", "tol", "toll", "kereta", "train", "krl", "mrt", "busway", "bus", "taxi", "transport", "transportation", "flight", "plane", "ride"
  ],
  "Belanja": [
    "belanja", "beli", "buy", "shopping", "groceries", "grocery", "shopee", "tokped", "tokopedia", "tiktok", "lazada", "indomaret", "alfamart",
    "supermarket", "baju", "clothes", "shirt", "celana", "pants", "sepatu", "shoes", "skincare", "pasar", "market"
  ],
  "Tagihan & Utilitas": [
    "listrik", "electricity", "pln", "air", "water", "pdam", "wifi", "internet", "indihome", "biznet", "pulsa", "kuota", "data", "telkomsel", "xl", "indosat", "sewa", "rent", "kontrakan", "kos", "apartment", "iuran", "bill", "bills", "utility", "utilities"
  ],
  "Kesehatan": [
    "obat", "medicine", "meds", "apotek", "pharmacy", "dokter", "doctor", "klinik", "clinic", "rs", "rumah sakit", "hospital", "vitamin", "bpjs", "health", "healthcare", "medical", "dental"
  ],
  "Hiburan": [
    "nonton", "bioskop", "cinema", "movie", "game", "steam", "topup", "ml", "ff", "netflix", "spotify", "youtube", "liburan", "vacation", "holiday", "trip", "hotel", "entertainment"
  ],
  "Pendidikan": [
    "buku", "book", "kursus", "course", "les", "tuition", "sekolah", "school", "kuliah", "college", "university", "spp", "seminar", "education"
  ],
  "Cicilan": [
    "cicilan", "kredit", "credit", "paylater", "spaylater", "kredivo", "angsuran", "installment", "debt", "loan"
  ],
  "Gaji": [
    "gaji", "salary", "payroll", "upah", "wage", "wages", "paycheck"
  ],
  "Freelance": [
    "freelance", "proyek", "project", "sidejob", "jasa", "service", "klien", "client", "gig", "contract"
  ],
  "Investasi": [
    "investasi", "investment", "invest", "saham", "stock", "stocks", "reksadana", "mutual fund", "crypto", "bitcoin", "bibit", "ajaib", "emas", "gold", "dividend", "interest"
  ],
  "Hadiah": [
    "hadiah", "gift", "giveaway", "angpao", "thr", "bonus", "reward", "grant"
  ],
};

export function matchesAccount(candidate: string, acc: { name: string; type: string }): boolean {
  const normCandidate = normalizeText(candidate);
  const normName = normalizeText(acc.name);
  const normType = normalizeText(acc.type);

  // 1. Exact match with account name
  if (normCandidate === normName) return true;

  // 2. Token match in account name (e.g. "bca" matches "bca utama", "mandiri" matches "mandiri tabungan")
  const nameTokens = normName.split(" ");
  if (nameTokens.includes(normCandidate)) return true;

  // 3. Name contains candidate or candidate contains name (multi-word match)
  if (normName.includes(normCandidate) && normCandidate.length >= 3) return true;

  // 4. Exact match with account type (e.g. "cash", "bank", "ewallet")
  if (normCandidate === normType) return true;

  // 5. Aliases specific to type only if account name doesn't specify another well-known institution
  if (acc.type === "cash") {
    const cashAliases = ["cash", "tunai", "dompet", "fisik", "wallet"];
    if (cashAliases.includes(normCandidate)) return true;
  } else if (acc.type === "ewallet") {
    const ewalletAliases = ["gopay", "ovo", "dana", "shopeepay", "spay", "linkaja", "ewallet", "e-wallet"];
    if (ewalletAliases.includes(normCandidate) && normName.includes(normCandidate)) return true;
  }

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
        let remainingWords = words.slice(0, words.length - len);
        // Strip trailing preposition like "from", "dari", "pake", "pakai", "via"
        if (remainingWords.length > 0) {
          const lastWord = remainingWords[remainingWords.length - 1].toLowerCase();
          if (["dari", "from", "pake", "pakai", "via", "ke", "to"].includes(lastWord)) {
            remainingWords = remainingWords.slice(0, remainingWords.length - 1);
          }
        }
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
    allCategories.find((c) => c.type === type && c.name.toLowerCase().includes("other")) ||
    allCategories.find((c) => c.type === type) ||
    allCategories[0];

  return fallback;
}

export function parseTransferParams<T extends { id: string; name: string; type: string }>(
  match: string,
  accounts: T[]
): { amount: number; fromAccount: T; toAccount: T; note: string } | { error: string } | null {
  const text = match.replace(/^(dari|from)\s+/i, "").trim();
  const parts = text.split(/\s+/);
  if (parts.length < 3) return null;

  const nominalStr = parts[0];
  const amount = parseNominal(nominalStr);
  if (amount <= 0 || isNaN(amount)) return null;

  const rest = parts.slice(1).join(" ");

  // Cek apakah ada pemisah 'ke', 'to', atau '->'
  const keMatch = rest.match(/^(.*?)\s+(?:ke|to|->)\s+(.*)$/i);
  let fromCandidate = "";
  let toAndNote = "";

  if (keMatch) {
    fromCandidate = keMatch[1].replace(/^(dari|from)\s+/i, "").trim();
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
