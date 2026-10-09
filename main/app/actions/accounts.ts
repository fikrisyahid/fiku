"use server";

import { db } from "@/db";
import { accounts, transactions, categories } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

import { getServerLocale } from "@/lib/i18n/server";
import { translateAccountName } from "@/lib/i18n/dictionary";

export async function getUserAccounts(userId: string, _familyId?: string | null) {
  const locale = await getServerLocale();
  const accs = await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
    orderBy: (acc, { desc, asc }) => [desc(acc.isDefault), asc(acc.createdAt)],
  });

  return accs.map((a) => ({
    ...a,
    name: translateAccountName(a.name, locale),
    rawName: a.name,
  }));
}

export async function getAccountById(
  accountId: string,
  userId: string,
  _familyId?: string | null
) {
  return await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
  });
}

export async function createAccount(data: {
  userId: string;
  name: string;
  type: string; // 'cash' | 'bank' | 'ewallet'
  balance?: number;
  currency?: string;
  isDefault?: boolean;
  familyId?: string | null;
}) {
  const {
    userId,
    name,
    type,
    balance = 0,
    currency = "IDR",
    isDefault = false,
  } = data;

  if (isDefault) {
    await db
      .update(accounts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(accounts.userId, userId));
  }

  const [newAccount] = await db
    .insert(accounts)
    .values({
      userId,
      name: name.trim(),
      type: type.toLowerCase(),
      balance: balance.toString(),
      currency,
      isDefault,
    })
    .returning();

  return newAccount;
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
  if (data.balance !== undefined) updateValues.balance = data.balance.toString();
  if (data.isDefault !== undefined) updateValues.isDefault = data.isDefault;

  const [updated] = await db
    .update(accounts)
    .set(updateValues)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();

  return updated;
}

export async function deleteAccount(
  accountId: string,
  userId: string,
  _familyId?: string | null
) {
  const account = await getAccountById(accountId, userId);
  if (!account) {
    throw new Error("Dompet tidak ditemukan.");
  }

  // Check whether the account has existing transactions
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.accountId, accountId),
  });

  if (tx) {
    throw new Error(
      `Dompet "${account.name}" tidak dapat dihapus karena sudah memiliki riwayat transaksi. Kamu bisa mengedit namanya atau mentransfer saldonya ke dompet lain.`
    );
  }

  // Check if this is the only remaining account
  const allAccounts = await getUserAccounts(userId);
  if (allAccounts.length <= 1) {
    throw new Error("Kamu tidak bisa menghapus dompet terakhirmu!");
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

  return deleted;
}

export async function setDefaultAccount(
  accountId: string,
  userId: string,
  _familyId?: string | null
) {
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
    throw new Error("Dompet tidak ditemukan.");
  }

  return updated;
}

export async function transferBetweenAccounts(data: {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  source?: "telegram" | "web";
  transactionDate?: string;
  familyId?: string | null;
}) {
  const {
    userId,
    fromAccountId,
    toAccountId,
    amount,
    note,
    source = "web",
    transactionDate = new Date().toISOString().split("T")[0],
  } = data;

  if (amount <= 0) {
    throw new Error("Nominal transfer harus lebih dari 0.");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("Dompet asal dan dompet tujuan tidak boleh sama!");
  }

  const fromAccount = await getAccountById(fromAccountId, userId);
  if (!fromAccount) {
    throw new Error("Dompet asal tidak ditemukan.");
  }

  const toAccount = await getAccountById(toAccountId, userId);
  if (!toAccount) {
    throw new Error("Dompet tujuan tidak ditemukan.");
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

    throw new Error(
      `Saldo tidak mencukupi! Saldo "${fromAccount.name}" saat ini hanya ${fmtCurrent}, tidak cukup untuk transfer sebesar ${fmtAmount}.`
    );
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
    throw new Error("Kategori transaksi tidak tersedia di sistem.");
  }

  const transferNoteOut = note
    ? `Transfer ke ${toAccount.name}: ${note}`
    : `Transfer ke ${toAccount.name}`;
  const transferNoteIn = note
    ? `Transfer dari ${fromAccount.name}: ${note}`
    : `Transfer dari ${fromAccount.name}`;

  await db.transaction(async (tx) => {
    // 1. Deduct balance from origin wallet
    await tx
      .update(accounts)
      .set({ balance: fromNewBalance.toString(), updatedAt: new Date() })
      .where(eq(accounts.id, fromAccountId));

    // 2. Add balance to destination wallet
    await tx
      .update(accounts)
      .set({ balance: toNewBalance.toString(), updatedAt: new Date() })
      .where(eq(accounts.id, toAccountId));

    // 3. Record outgoing transaction on origin wallet
    await tx.insert(transactions).values({
      userId,
      accountId: fromAccountId,
      categoryId: expenseTransferCat.id,
      amount: amount.toString(),
      type: "expense",
      note: transferNoteOut,
      source,
      transactionDate,
    });

    // 4. Record incoming transaction on destination wallet
    await tx.insert(transactions).values({
      userId,
      accountId: toAccountId,
      categoryId: incomeTransferCat.id,
      amount: amount.toString(),
      type: "income",
      note: transferNoteIn,
      source,
      transactionDate,
    });
  });

  return {
    fromAccount: { ...fromAccount, balance: fromNewBalance.toString() },
    toAccount: { ...toAccount, balance: toNewBalance.toString() },
    amount,
  };
}
