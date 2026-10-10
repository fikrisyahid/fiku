"use server";

import { db } from "@/db";
import { accounts, transactions, categories } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

import { getServerLocale } from "@/lib/i18n/server";
import { translateAccountName } from "@/lib/i18n/dictionary";
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
  getActiveUserPrivateKey,
  getUserPublicKey,
} from "@/lib/crypto";

export async function getUserAccounts(userId: string, _familyId?: string | null) {
  const locale = await getServerLocale();
  const accs = await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
    orderBy: (acc, { desc, asc }) => [desc(acc.isDefault), asc(acc.createdAt)],
  });

  const privKey = await getActiveUserPrivateKey(userId);

  return accs.map((a) => {
    let plainBalance = a.balance;
    if (privKey && a.balance.startsWith("enc:v1:")) {
      try {
        plainBalance = decryptWithPrivateKey(a.balance, privKey);
      } catch (e) {
        console.error("Failed to decrypt account balance for account", a.id, e);
        plainBalance = "0";
      }
    } else if (!privKey && a.balance.startsWith("enc:v1:")) {
      plainBalance = "0";
    }

    return {
      ...a,
      balance: plainBalance,
      name: translateAccountName(a.name, locale),
      rawName: a.name,
    };
  });
}

export async function getAccountById(
  accountId: string,
  userId: string,
  _familyId?: string | null
) {
  const acc = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
  });

  if (!acc) return null;

  const privKey = await getActiveUserPrivateKey(userId);
    let plainBalance = acc.balance;
    if (privKey && acc.balance.startsWith("enc:v1:")) {
      try {
        plainBalance = decryptWithPrivateKey(acc.balance, privKey);
      } catch (e) {
        console.error("Failed to decrypt account balance for account", acc.id, e);
        plainBalance = "0";
      }
    } else if (!privKey && acc.balance.startsWith("enc:v1:")) {
      plainBalance = "0";
    }

  return {
    ...acc,
    balance: plainBalance,
  };
}

export async function createAccount(data: {
  userId: string;
  name: string;
  type: string; // 'cash' | 'bank' | 'ewallet'
  balance?: number;
  isDefault?: boolean;
  familyId?: string | null;
}) {
  const {
    userId,
    name,
    type,
    balance = 0,
    isDefault = false,
  } = data;

  if (isDefault) {
    await db
      .update(accounts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(accounts.userId, userId));
  }

  const publicKey = await getUserPublicKey(userId);
  const rawBalanceStr = balance.toString();
  const storedBalance = publicKey
    ? encryptWithPublicKey(rawBalanceStr, publicKey)
    : rawBalanceStr;

  const [newAccount] = await db
    .insert(accounts)
    .values({
      userId,
      name: name.trim(),
      type: type.toLowerCase(),
      balance: storedBalance,
      isDefault,
    })
    .returning();

  return {
    ...newAccount,
    balance: rawBalanceStr,
  };
}

export async function updateAccount(
  accountId: string,
  userId: string,
  data: {
    name?: string;
    type?: string;
    balance?: number;
    isDefault?: boolean;
  },
  _familyId?: string | null
) {
  if (data.isDefault) {
    await db
      .update(accounts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(accounts.userId, userId));
  }

  const updateValues: Partial<typeof accounts.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateValues.name = data.name.trim();
  if (data.type !== undefined) updateValues.type = data.type.toLowerCase();
  if (data.balance !== undefined) {
    const publicKey = await getUserPublicKey(userId);
    const rawBalanceStr = data.balance.toString();
    updateValues.balance = publicKey
      ? encryptWithPublicKey(rawBalanceStr, publicKey)
      : rawBalanceStr;
  }
  if (data.isDefault !== undefined) updateValues.isDefault = data.isDefault;

  const [updated] = await db
    .update(accounts)
    .set(updateValues)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();

  return updated ? {
    ...updated,
    balance: data.balance !== undefined ? data.balance.toString() : updated.balance,
  } : null;
}

export async function deleteAccount(
  accountId: string,
  userId: string,
  _familyId?: string | null
): Promise<{ success: true; data: any } | { success: false; error: string; data?: never }> {
  const account = await getAccountById(accountId, userId);
  if (!account) {
    return { success: false, error: "Dompet tidak ditemukan." };
  }

  // Check whether the account has existing transactions
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.accountId, accountId),
  });

  if (tx) {
    return {
      success: false,
      error: `Dompet "${account.name}" tidak dapat dihapus karena sudah memiliki riwayat transaksi. Kamu bisa mengedit namanya atau mentransfer saldonya ke dompet lain.`,
    };
  }

  // Check if this is the only remaining account
  const allAccounts = await getUserAccounts(userId);
  if (allAccounts.length <= 1) {
    return { success: false, error: "Kamu tidak bisa menghapus dompet terakhirmu!" };
  }

  const [deleted] = await db
    .delete(accounts)
    .where(eq(accounts.id, accountId))
    .returning();

  // If the deleted account was the default, appoint one of the remaining accounts as new default
  if (deleted.isDefault) {
    const remaining = allAccounts.find((a) => a.id !== deleted.id);
    if (remaining) {
      await setDefaultAccount(remaining.id, userId);
    }
  }

  return { success: true, data: deleted };
}

export async function setDefaultAccount(
  accountId: string,
  userId: string,
  _familyId?: string | null
): Promise<{ success: true; data: any } | { success: false; error: string; data?: never }> {
  // 1. Clear isDefault flag from all wallets of the user
  await db
    .update(accounts)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(accounts.userId, userId));

  // 2. Set chosen wallet as default
  const [updated] = await db
    .update(accounts)
    .set({ isDefault: true, updatedAt: new Date() })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();

  if (!updated) {
    return { success: false, error: "Dompet tidak ditemukan." };
  }

  return { success: true, data: updated };
}

export async function transferBetweenAccounts(data: {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  transactionDate?: string;
  familyId?: string | null;
}): Promise<
  | { success: true; fromAccount: any; toAccount: any; amount: number }
  | { success: false; error: string; fromAccount?: never; toAccount?: never; amount?: never }
> {
  const {
    userId,
    fromAccountId,
    toAccountId,
    amount,
    note,
    transactionDate = new Date().toISOString().split("T")[0],
  } = data;

  if (amount <= 0) {
    return { success: false, error: "Nominal transfer harus lebih dari 0." };
  }

  if (fromAccountId === toAccountId) {
    return { success: false, error: "Dompet asal dan dompet tujuan tidak boleh sama!" };
  }

  const privKey = await getActiveUserPrivateKey(userId);
  if (!privKey) {
    return { success: false, error: "Sesi enkripsi telah berakhir. Silakan login kembali untuk melakukan transfer." };
  }

  const fromAccount = await getAccountById(fromAccountId, userId);
  if (!fromAccount) {
    return { success: false, error: "Dompet asal tidak ditemukan." };
  }

  const toAccount = await getAccountById(toAccountId, userId);
  if (!toAccount) {
    return { success: false, error: "Dompet tujuan tidak ditemukan." };
  }

  const fromBalance = parseFloat(fromAccount.balance);
  if (fromBalance < amount) {
    const fmtCurrent = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(fromBalance);
    const fmtAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

    return {
      success: false,
      error: `Saldo tidak mencukupi! Saldo "${fromAccount.name}" saat ini hanya ${fmtCurrent}, tidak cukup untuk transfer sebesar ${fmtAmount}.`,
    };
  }

  const toBalance = parseFloat(toAccount.balance);
  const fromNewBalance = fromBalance - amount;
  const toNewBalance = toBalance + amount;

  // Look up categories for logging transfer mutations
  const allCategories = await db.query.categories.findMany({
    where: or(isNull(categories.userId), eq(categories.userId, userId)),
  });

  const expenseTransferCat =
    allCategories.find((c) => c.type === "expense" && c.name.toLowerCase().includes("transfer")) ||
    allCategories.find((c) => c.type === "expense" && c.name.toLowerCase().includes("lainnya")) ||
    allCategories.find((c) => c.type === "expense");

  const incomeTransferCat =
    allCategories.find((c) => c.type === "income" && c.name.toLowerCase().includes("transfer")) ||
    allCategories.find((c) => c.type === "income" && c.name.toLowerCase().includes("lainnya")) ||
    allCategories.find((c) => c.type === "income");

  if (!expenseTransferCat || !incomeTransferCat) {
    return { success: false, error: "Kategori transaksi tidak tersedia di sistem." };
  }

  const transferNoteOut = note
    ? `Transfer ke ${toAccount.name}: ${note}`
    : `Transfer ke ${toAccount.name}`;
  const transferNoteIn = note
    ? `Transfer dari ${fromAccount.name}: ${note}`
    : `Transfer dari ${fromAccount.name}`;

  const publicKey = await getUserPublicKey(userId);
  const fromBalStored = publicKey ? encryptWithPublicKey(fromNewBalance.toString(), publicKey) : fromNewBalance.toString();
  const toBalStored = publicKey ? encryptWithPublicKey(toNewBalance.toString(), publicKey) : toNewBalance.toString();
  const amtStored = publicKey ? encryptWithPublicKey(amount.toString(), publicKey) : amount.toString();
  const noteOutStored = note ? (publicKey ? encryptWithPublicKey(transferNoteOut, publicKey) : transferNoteOut) : null;
  const noteInStored = note ? (publicKey ? encryptWithPublicKey(transferNoteIn, publicKey) : transferNoteIn) : null;

  await db.transaction(async (tx) => {
    // 1. Deduct balance from origin wallet
    await tx
      .update(accounts)
      .set({ balance: fromBalStored, updatedAt: new Date() })
      .where(eq(accounts.id, fromAccountId));

    // 2. Add balance to destination wallet
    await tx
      .update(accounts)
      .set({ balance: toBalStored, updatedAt: new Date() })
      .where(eq(accounts.id, toAccountId));

    // 3. Record outgoing transaction on origin wallet
    await tx.insert(transactions).values({
      userId,
      accountId: fromAccountId,
      categoryId: expenseTransferCat.id,
      amount: amtStored,
      type: "expense",
      note: noteOutStored,
      transactionDate,
    });

    // 4. Record incoming transaction on destination wallet
    await tx.insert(transactions).values({
      userId,
      accountId: toAccountId,
      categoryId: incomeTransferCat.id,
      amount: amtStored,
      type: "income",
      note: noteInStored,
      transactionDate,
    });
  });

  return {
    success: true,
    fromAccount: { ...fromAccount, balance: fromNewBalance.toString() },
    toAccount: { ...toAccount, balance: toNewBalance.toString() },
    amount,
  };
}
