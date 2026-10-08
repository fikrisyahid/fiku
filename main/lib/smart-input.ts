"use server";

import { parseNominal, extractWalletAndDescription, findMatchingCategory, parseTransferParams } from "@/lib/bot-commands/handlers";
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
