"use server";

import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getUserTransactions(
  userId: string,
  options?: {
    limit?: number;
    type?: "income" | "expense";
    accountId?: string;
  }
) {
  const limit = options?.limit || 15;

  return await db.query.transactions.findMany({
    where: (tx, { eq: eqField, and: andFields }) => {
      const conditions = [eqField(tx.userId, userId)];
      if (options?.type) conditions.push(eqField(tx.type, options.type));
      if (options?.accountId) conditions.push(eqField(tx.accountId, options.accountId));
      return andFields(...conditions);
    },
    with: {
      account: true,
      category: true,
      budget: true,
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
  } = data;

  if (amount <= 0) {
    throw new Error("Nominal transaksi harus lebih dari 0.");
  }

  // 1. Ambil dompet tujuan
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
  });

  if (!account) {
    throw new Error("Dompet / rekening tidak ditemukan.");
  }

  const currentBalance = parseFloat(account.balance);
  const newBalance =
    type === "income" ? currentBalance + amount : currentBalance - amount;

  // 2. Simpan transaksi
  const [newTx] = await db
    .insert(transactions)
    .values({
      userId,
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

export async function deleteTransaction(transactionId: string, userId: string) {
  const tx = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
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
