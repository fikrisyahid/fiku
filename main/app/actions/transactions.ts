"use server";

import { db } from "@/db";
import { transactions, accounts } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";

import { getServerLocale } from "@/lib/i18n/server";
import { translateCategoryName, translateAccountName } from "@/lib/i18n/dictionary";

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
  const locale = await getServerLocale();

  const txs = await db.query.transactions.findMany({
    where: (tx, { eq: eqField, and: andFields }) => {
      const conditions = [eqField(tx.userId, userId)];

      if (options?.type) conditions.push(eqField(tx.type, options.type));
      if (options?.accountId) conditions.push(eqField(tx.accountId, options.accountId));
      return andFields(...conditions);
    },
    with: {
      account: true,
      toAccount: true,
      category: true,
      user: true,
    },
    orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
    limit,
  });

  return txs.map((tx) => ({
    ...tx,
    account: tx.account
      ? { ...tx.account, name: translateAccountName(tx.account.name, locale), rawName: tx.account.name }
      : tx.account,
    toAccount: tx.toAccount
      ? { ...tx.toAccount, name: translateAccountName(tx.toAccount.name, locale), rawName: tx.toAccount.name }
      : tx.toAccount,
    category: tx.category
      ? { ...tx.category, name: translateCategoryName(tx.category.name, locale), rawName: tx.category.name }
      : tx.category,
  }));
}

export async function createTransaction(data: {
  userId: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  type: "income" | "expense" | "transfer";
  note?: string;
  source?: "telegram" | "web";
  transactionDate?: string; // YYYY-MM-DD
  familyId?: string | null;
}) {
  const {
    userId,
    accountId,
    toAccountId = null,
    categoryId,
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

  // Handle transfer transaction
  if (type === "transfer") {
    if (!toAccountId || accountId === toAccountId) {
      throw new Error("Kantong asal dan tujuan harus berbeda.");
    }

    const fromAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });
    const toAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, toAccountId),
    });

    if (!fromAccount || !toAccount) {
      throw new Error("Kantong asal atau tujuan tidak ditemukan.");
    }

    const fromBalance = parseFloat(fromAccount.balance);
    const toBalance = parseFloat(toAccount.balance);

    if (amount > fromBalance) {
      const fmtFrom = new Intl.NumberFormat("id-ID", {
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
        `Saldo tidak mencukupi! Saldo "${fromAccount.name}" saat ini hanya ${fmtFrom}, tidak cukup untuk transfer sebesar ${fmtAmount}.`
      );
    }

    const fromNewBalance = fromBalance - amount;
    const toNewBalance = toBalance + amount;

    let createdTx: any;

    await db.transaction(async (tx) => {
      // 1. Deduct from origin wallet
      await tx
        .update(accounts)
        .set({ balance: fromNewBalance.toString(), updatedAt: new Date() })
        .where(eq(accounts.id, accountId));

      // 2. Add to destination wallet
      await tx
        .update(accounts)
        .set({ balance: toNewBalance.toString(), updatedAt: new Date() })
        .where(eq(accounts.id, toAccountId));

      // 3. Persist single transfer transaction record (total balance unchanged)
      const [newTx] = await tx
        .insert(transactions)
        .values({
          userId,
          accountId,
          toAccountId,
          categoryId: categoryId || null,
          amount: amount.toString(),
          type: "transfer",
          note: note?.trim() || `Transfer ke ${toAccount.name}`,
          source,
          transactionDate,
        })
        .returning();

      createdTx = newTx;
    });

    return {
      transaction: createdTx,
      updatedAccount: {
        ...fromAccount,
        balance: fromNewBalance.toString(),
      },
    };
  }

  // 1. Fetch destination wallet
  const account = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, accountId), eq(accounts.userId, userId)),
  });

  if (!account) {
    throw new Error("Dompet / rekening tidak ditemukan.");
  }

  const currentBalance = parseFloat(account.balance);

  // Balance validation: expense amount cannot exceed existing balance
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

  // 2. Persist transaction
  const [newTx] = await db
    .insert(transactions)
    .values({
      userId,
      accountId,
      toAccountId: null,
      categoryId: categoryId || null,
      amount: amount.toString(),
      type,
      note: note?.trim() || null,
      source,
      transactionDate,
    })
    .returning();

  // 3. Update account balance
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
  const tx = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
    with: { account: true, toAccount: true },
  });

  if (!tx) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  const txAmount = parseFloat(tx.amount);

  await db.transaction(async (trx) => {
    if (tx.type === "transfer" && tx.toAccountId) {
      // Revert transfer: add back to fromAccount, deduct from toAccount
      const fromAcc = await trx.query.accounts.findFirst({
        where: eq(accounts.id, tx.accountId),
      });
      const toAcc = await trx.query.accounts.findFirst({
        where: eq(accounts.id, tx.toAccountId),
      });

      if (fromAcc) {
        const fromBal = parseFloat(fromAcc.balance) + txAmount;
        await trx
          .update(accounts)
          .set({ balance: fromBal.toString(), updatedAt: new Date() })
          .where(eq(accounts.id, tx.accountId));
      }

      if (toAcc) {
        const toBal = parseFloat(toAcc.balance) - txAmount;
        await trx
          .update(accounts)
          .set({ balance: toBal.toString(), updatedAt: new Date() })
          .where(eq(accounts.id, tx.toAccountId));
      }
    } else {
      // Revert income / expense
      const currentBalance = parseFloat(tx.account.balance);
      const revertedBalance =
        tx.type === "income" ? currentBalance - txAmount : currentBalance + txAmount;

      await trx
        .update(accounts)
        .set({
          balance: revertedBalance.toString(),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, tx.accountId));
    }

    await trx
      .delete(transactions)
      .where(eq(transactions.id, transactionId));
  });

  return { success: true };
}

export async function deleteTransactionsBatch(
  transactionIds: string[],
  userId: string,
  _familyId?: string | null
) {
  if (!transactionIds.length) {
    return { success: true, count: 0 };
  }

  const txList = await db.query.transactions.findMany({
    where: (tx, { inArray, and: andFields, eq: eqField }) =>
      andFields(eqField(tx.userId, userId), inArray(tx.id, transactionIds)),
    with: { account: true, toAccount: true },
  });

  if (!txList.length) {
    return { success: true, count: 0 };
  }

  await db.transaction(async (trx) => {
    // Process balance reversals per transaction
    for (const tx of txList) {
      const txAmount = parseFloat(tx.amount);

      if (tx.type === "transfer" && tx.toAccountId) {
        const fromAcc = await trx.query.accounts.findFirst({
          where: eq(accounts.id, tx.accountId),
        });
        const toAcc = await trx.query.accounts.findFirst({
          where: eq(accounts.id, tx.toAccountId),
        });

        if (fromAcc) {
          const fromBal = parseFloat(fromAcc.balance) + txAmount;
          await trx
            .update(accounts)
            .set({ balance: fromBal.toString(), updatedAt: new Date() })
            .where(eq(accounts.id, tx.accountId));
        }

        if (toAcc) {
          const toBal = parseFloat(toAcc.balance) - txAmount;
          await trx
            .update(accounts)
            .set({ balance: toBal.toString(), updatedAt: new Date() })
            .where(eq(accounts.id, tx.toAccountId));
        }
      } else {
        const currentBal = parseFloat(tx.account.balance);
        const revertedBal =
          tx.type === "income" ? currentBal - txAmount : currentBal + txAmount;

        await trx
          .update(accounts)
          .set({
            balance: revertedBal.toString(),
            updatedAt: new Date(),
          })
          .where(eq(accounts.id, tx.accountId));
      }
    }

    // Delete all matched transactions
    const foundIds = txList.map((t) => t.id);
    for (const id of foundIds) {
      await trx.delete(transactions).where(eq(transactions.id, id));
    }
  });

  return { success: true, count: txList.length };
}

export async function updateTransaction(
  transactionId: string,
  data: {
    userId: string;
    familyId?: string | null;
    accountId?: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    amount?: number;
    type?: "income" | "expense" | "transfer";
    note?: string | null;
    transactionDate?: string;
  }
) {
  const {
    userId,
    familyId = null,
    accountId,
    toAccountId,
    categoryId,
    amount,
    type,
    note,
    transactionDate,
  } = data;

  const existingTx = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, transactionId), eq(transactions.userId, userId)),
    with: { account: true, toAccount: true },
  });

  if (!existingTx) {
    throw new Error("Transaksi tidak ditemukan.");
  }

  const oldAmount = parseFloat(existingTx.amount);
  const oldType = existingTx.type as "income" | "expense" | "transfer";
  const oldAccountId = existingTx.accountId;
  const oldToAccountId = existingTx.toAccountId;

  const newAmount = amount !== undefined ? amount : oldAmount;
  const newType = type !== undefined ? type : oldType;
  const newAccountId = accountId !== undefined ? accountId : oldAccountId;
  const newToAccountId = toAccountId !== undefined ? toAccountId : oldToAccountId;

  if (newAmount <= 0) {
    throw new Error("Nominal transaksi harus lebih dari 0.");
  }

  await db.transaction(async (tx) => {
    // 1. Revert previous effect on account(s)
    if (oldType === "transfer" && oldToAccountId) {
      const fromAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, oldAccountId) });
      const toAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, oldToAccountId) });
      if (fromAcc) {
        const bal = parseFloat(fromAcc.balance) + oldAmount;
        await tx.update(accounts).set({ balance: bal.toString(), updatedAt: new Date() }).where(eq(accounts.id, oldAccountId));
      }
      if (toAcc) {
        const bal = parseFloat(toAcc.balance) - oldAmount;
        await tx.update(accounts).set({ balance: bal.toString(), updatedAt: new Date() }).where(eq(accounts.id, oldToAccountId));
      }
    } else {
      const oldAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, oldAccountId) });
      if (oldAcc) {
        const bal = oldType === "income" ? parseFloat(oldAcc.balance) - oldAmount : parseFloat(oldAcc.balance) + oldAmount;
        await tx.update(accounts).set({ balance: bal.toString(), updatedAt: new Date() }).where(eq(accounts.id, oldAccountId));
      }
    }

    // 2. Apply new effect on account(s)
    if (newType === "transfer") {
      if (!newToAccountId || newAccountId === newToAccountId) {
        throw new Error("Kantong asal dan tujuan harus berbeda.");
      }
      const fromAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, newAccountId) });
      const toAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, newToAccountId) });
      if (!fromAcc || !toAcc) throw new Error("Kantong asal atau tujuan tidak ditemukan.");

      const fromBal = parseFloat(fromAcc.balance) - newAmount;
      if (fromBal < 0) {
        const fmtFrom = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(parseFloat(fromAcc.balance));
        const fmtAmount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(newAmount);

        throw new Error(
          `Saldo tidak mencukupi! Saldo "${fromAcc.name}" saat ini ${fmtFrom}, tidak cukup untuk transfer sebesar ${fmtAmount}.`
        );
      }
      const toBal = parseFloat(toAcc.balance) + newAmount;

      await tx.update(accounts).set({ balance: fromBal.toString(), updatedAt: new Date() }).where(eq(accounts.id, newAccountId));
      await tx.update(accounts).set({ balance: toBal.toString(), updatedAt: new Date() }).where(eq(accounts.id, newToAccountId));
    } else {
      const targetAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, newAccountId) });
      if (!targetAcc) throw new Error("Kantong tidak ditemukan.");
      const currentBal = parseFloat(targetAcc.balance);

      if (newType === "expense" && currentBal < newAmount) {
        const fmtCurrent = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(currentBal);
        const fmtAmount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(newAmount);

        throw new Error(
          `Saldo tidak mencukupi! Saldo "${targetAcc.name}" saat ini ${fmtCurrent}, tidak cukup untuk pengeluaran sebesar ${fmtAmount}.`
        );
      }

      const newBal = newType === "income" ? currentBal + newAmount : currentBal - newAmount;
      await tx.update(accounts).set({ balance: newBal.toString(), updatedAt: new Date() }).where(eq(accounts.id, newAccountId));
    }

    // 3. Update transaction record
    const updatePayload: Record<string, any> = {
      amount: newAmount.toString(),
      type: newType,
      accountId: newAccountId,
      toAccountId: newType === "transfer" ? newToAccountId : null,
      categoryId: newType === "transfer" ? null : categoryId,
      updatedAt: new Date(),
    };
    if (note !== undefined) updatePayload.note = note ? note.trim() : null;
    if (transactionDate !== undefined) updatePayload.transactionDate = transactionDate;

    await tx
      .update(transactions)
      .set(updatePayload)
      .where(eq(transactions.id, transactionId));
  });

  return { success: true };
}

export async function importTransactionsBatch(
  userId: string,
  familyId: string | null | undefined,
  records: Array<{
    transactionDate: string;
    type: "income" | "expense" | "transfer";
    accountId: string;
    toAccountId?: string | null;
    categoryId?: string | null;
    amount: number;
    note?: string;
  }>
) {
  if (!records || records.length === 0) {
    return { success: true, count: 0 };
  }

  return await db.transaction(async (tx) => {
    let imported = 0;
    for (const item of records) {
      if (item.amount <= 0) continue;

      if (item.type === "transfer") {
        if (!item.toAccountId || item.accountId === item.toAccountId) continue;
        const fromAcc = await tx.query.accounts.findFirst({
          where: eq(accounts.id, item.accountId),
        });
        const toAcc = await tx.query.accounts.findFirst({
          where: eq(accounts.id, item.toAccountId),
        });
        if (!fromAcc || !toAcc) continue;

        const fromBal = parseFloat(fromAcc.balance) - item.amount;
        const toBal = parseFloat(toAcc.balance) + item.amount;

        await tx
          .update(accounts)
          .set({ balance: fromBal.toString(), updatedAt: new Date() })
          .where(eq(accounts.id, item.accountId));
        await tx
          .update(accounts)
          .set({ balance: toBal.toString(), updatedAt: new Date() })
          .where(eq(accounts.id, item.toAccountId));

        await tx.insert(transactions).values({
          userId,
          accountId: item.accountId,
          toAccountId: item.toAccountId,
          categoryId: null,
          amount: item.amount.toString(),
          type: "transfer",
          note: item.note ? item.note.trim() : null,
          source: "web",
          transactionDate: item.transactionDate,
        });
        imported++;
      } else {
        const acc = await tx.query.accounts.findFirst({
          where: eq(accounts.id, item.accountId),
        });
        if (!acc) continue;

        const currentBal = parseFloat(acc.balance);
        const newBal =
          item.type === "income" ? currentBal + item.amount : currentBal - item.amount;

        await tx
          .update(accounts)
          .set({ balance: newBal.toString(), updatedAt: new Date() })
          .where(eq(accounts.id, item.accountId));

        await tx.insert(transactions).values({
          userId,
          accountId: item.accountId,
          toAccountId: null,
          categoryId: item.categoryId || null,
          amount: item.amount.toString(),
          type: item.type,
          note: item.note ? item.note.trim() : null,
          source: "web",
          transactionDate: item.transactionDate,
        });
        imported++;
      }
    }

    return { success: true, count: imported };
  });
}

