"use server";

import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

export async function getUserTransactions(
  userId: string,
  options?: {
    limit?: number;
    type?: "income" | "expense";
    accountId?: string;
    familyId?: string | null;
  }
) {
  const limit = options?.limit || 15;
  const familyId = options?.familyId;

  return await db.query.transactions.findMany({
    where: (tx, { eq: eqField, and: andFields }) => {
      const conditions = [];

      if (familyId) {
        conditions.push(eqField(tx.familyId, familyId));
      } else {
        conditions.push(eqField(tx.userId, userId));
        conditions.push(isNull(tx.familyId));
      }

      if (options?.type) conditions.push(eqField(tx.type, options.type));
      if (options?.accountId) conditions.push(eqField(tx.accountId, options.accountId));
      return andFields(...conditions);
    },
    with: {
      account: true,
      category: true,
      budget: true,
      user: true,
    },
    orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
    limit,
  });
}

export async function createTransaction(data: {
  userId: string;
  accountId: string;
  categoryId: string;
  budgetId?: string;
  amount: number;
  type: "income" | "expense";
  note?: string;
  source?: "telegram" | "web";
  transactionDate?: string; // YYYY-MM-DD
  familyId?: string | null;
}) {
  const {
    userId,
    accountId,
    categoryId,
    budgetId,
    amount,
    type,
    note,
    source = "telegram",
    transactionDate = new Date().toISOString().split("T")[0],
    familyId = null,
  } = data;

  if (amount <= 0) {
    throw new Error("Nominal transaksi harus lebih dari 0.");
  }

  // 1. Ambil dompet tujuan
  const accountWhere = familyId
    ? and(eq(accounts.id, accountId), eq(accounts.familyId, familyId))
    : and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.familyId));

  const account = await db.query.accounts.findFirst({
    where: accountWhere,
  });

  if (!account) {
    throw new Error("Dompet / rekening tidak ditemukan.");
  }

  const currentBalance = parseFloat(account.balance);

  // Validasi saldo: pengeluaran tidak boleh melebihi saldo yang ada
  if (type === "expense" && amount > currentBalance) {
    const fmtCurrent = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(currentBalance);
    const fmtAmount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

    throw new Error(
      `Saldo tidak mencukupi! Saldo "${account.name}" saat ini hanya ${fmtCurrent}, tidak cukup untuk pengeluaran sebesar ${fmtAmount}.`
    );
  }

  const newBalance =
    type === "income" ? currentBalance + amount : currentBalance - amount;

  // 2. Simpan transaksi
  const [newTx] = await db
    .insert(transactions)
    .values({
      userId,
      familyId,
      accountId,
      categoryId,
      budgetId: budgetId || null,
      amount: amount.toString(),
      type,
      note: note?.trim() || null,
      source,
      transactionDate,
    })
    .returning();

  // 3. Update saldo dompet
  await db
    .update(accounts)
    .set({
      balance: newBalance.toString(),
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId));

  return {
    transaction: newTx,
    updatedAccount: {
      ...account,
      balance: newBalance.toString(),
    },
  };
}

export async function deleteTransaction(
  transactionId: string,
  userId: string,
  familyId?: string | null
) {
  const txWhere = familyId
    ? and(eq(transactions.id, transactionId), eq(transactions.familyId, familyId))
    : and(eq(transactions.id, transactionId), eq(transactions.userId, userId), isNull(transactions.familyId));

  const tx = await db.query.transactions.findFirst({
    where: txWhere,
    with: { account: true },
  });

  if (!tx) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  // Revert saldo akun
  const txAmount = parseFloat(tx.amount);
  const currentBalance = parseFloat(tx.account.balance);
  const revertedBalance =
    tx.type === "income" ? currentBalance - txAmount : currentBalance + txAmount;

  await db
    .update(accounts)
    .set({
      balance: revertedBalance.toString(),
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, tx.accountId));

  const [deleted] = await db
    .delete(transactions)
    .where(eq(transactions.id, transactionId))
    .returning();

  return deleted;
}
