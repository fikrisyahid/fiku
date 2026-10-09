"use server";

import { db } from "@/db";
import { transactions, accounts, userSettings } from "@/db/schema";
import { eq, and, desc, asc, count, isNull } from "drizzle-orm";

import { getServerLocale } from "@/lib/i18n/server";
import { translateCategoryName, translateAccountName } from "@/lib/i18n/dictionary";
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
  getActiveUserPrivateKey,
  getUserPublicKey,
} from "@/lib/crypto";
import {
  getUserSettings,
  incrementUserTransactionCount,
  decrementUserTransactionCount,
} from "@/app/actions/settings";

function mapAndDecryptTransaction(tx: any, privKey: string | null, locale: any) {
  let plainAmount = tx.amount;
  let plainNote = tx.note;

  if (privKey) {
    if (tx.amount && tx.amount.startsWith("enc:v1:")) {
      try {
        plainAmount = decryptWithPrivateKey(tx.amount, privKey);
      } catch (e) {
        console.error("Failed to decrypt amount for tx", tx.id, e);
        plainAmount = "0";
      }
    }
    if (tx.note && tx.note.startsWith("enc:v1:")) {
      try {
        plainNote = decryptWithPrivateKey(tx.note, privKey);
      } catch (e) {
        console.error("Failed to decrypt note for tx", tx.id, e);
        plainNote = "";
      }
    }
  } else {
    // If private key is not present in RAM, fallback safely to avoid NaN in computations
    if (tx.amount && tx.amount.startsWith("enc:v1:")) {
      plainAmount = "0";
    }
    if (tx.note && tx.note.startsWith("enc:v1:")) {
      plainNote = "";
    }
  }

  let accPlainBalance = tx.account?.balance;
  if (privKey && tx.account?.balance?.startsWith("enc:v1:")) {
    try {
      accPlainBalance = decryptWithPrivateKey(tx.account.balance, privKey);
    } catch (e) {
      console.error("Failed to decrypt account balance for tx", tx.id, e);
    }
  }

  let toAccPlainBalance = tx.toAccount?.balance;
  if (privKey && tx.toAccount?.balance?.startsWith("enc:v1:")) {
    try {
      toAccPlainBalance = decryptWithPrivateKey(tx.toAccount.balance, privKey);
    } catch (e) {
      console.error("Failed to decrypt toAccount balance for tx", tx.id, e);
    }
  }

  return {
    ...tx,
    amount: plainAmount,
    note: plainNote,
    rawAmount: tx.amount,
    rawNote: tx.note,
    account: tx.account
      ? {
          ...tx.account,
          balance: accPlainBalance ?? tx.account.balance,
          rawBalance: tx.account.balance,
          name: translateAccountName(tx.account.name, locale),
          rawName: tx.account.name,
        }
      : tx.account,
    toAccount: tx.toAccount
      ? {
          ...tx.toAccount,
          balance: toAccPlainBalance ?? tx.toAccount.balance,
          rawBalance: tx.toAccount.balance,
          name: translateAccountName(tx.toAccount.name, locale),
          rawName: tx.toAccount.name,
        }
      : tx.toAccount,
    category: tx.category
      ? { ...tx.category, name: translateCategoryName(tx.category.name, locale), rawName: tx.category.name }
      : tx.category,
  };
}

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

  const privKey = getActiveUserPrivateKey(userId);

  return txs.map((tx) => mapAndDecryptTransaction(tx, privKey, locale));
}

export interface PaginatedTransactionsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: "transactionDate" | "type" | "category" | "account" | "amount" | "note";
  sortOrder?: "asc" | "desc";
  type?: "income" | "expense" | "transfer";
  accountId?: string;
}

export async function getUserTransactionsPaginated(
  userId: string,
  options: PaginatedTransactionsOptions = {}
) {
  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(5, options.pageSize || 25));
  const sortBy = options.sortBy || "transactionDate";
  const sortOrder = options.sortOrder || "desc";
  const searchQuery = (options.search || "").trim().toLowerCase();
  const locale = await getServerLocale();
  const privKey = getActiveUserPrivateKey(userId);

  // 1. Fetch matching transactions
  // If sorting is by native date or there is no query, we can optimize or fetch with appropriate order
  const orderClause =
    sortBy === "transactionDate"
      ? sortOrder === "asc"
        ? [asc(transactions.transactionDate), asc(transactions.createdAt)]
        : [desc(transactions.transactionDate), desc(transactions.createdAt)]
      : [desc(transactions.transactionDate), desc(transactions.createdAt)];

  // For full search across decrypted fields (amount, note) or in-memory sort,
  // we fetch records, decrypt, filter & sort, then return paginated slice
  const txs = await db.query.transactions.findMany({
    where: (tx, { eq: eqField, and: andFields }) => {
      const conditions = [eqField(tx.userId, userId)];
      if (options.type) conditions.push(eqField(tx.type, options.type));
      if (options.accountId) conditions.push(eqField(tx.accountId, options.accountId));
      return andFields(...conditions);
    },
    with: {
      account: true,
      toAccount: true,
      category: true,
      user: true,
    },
    orderBy: orderClause,
  });

  // 2. Decrypt all matching records for this user
  let decryptedList = txs.map((tx) => mapAndDecryptTransaction(tx, privKey, locale));

  // 3. In-Memory Search (handles decrypted amount, note, wallet names, category names, dates)
  if (searchQuery) {
    decryptedList = decryptedList.filter((item) => {
      const noteMatch = (item.note || "").toLowerCase().includes(searchQuery);
      const amountMatch = (item.amount?.toString() || "").includes(searchQuery);
      const dateMatch = (item.transactionDate || "").includes(searchQuery);
      const accMatch = (item.account?.name || "").toLowerCase().includes(searchQuery);
      const toAccMatch = (item.toAccount?.name || "").toLowerCase().includes(searchQuery);
      const catMatch = (item.category?.name || "").toLowerCase().includes(searchQuery);
      return noteMatch || amountMatch || dateMatch || accMatch || toAccMatch || catMatch;
    });
  }

  // 4. In-Memory Sorting (for decrypted fields like amount, note, category, account)
  if (sortBy !== "transactionDate") {
    decryptedList.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";

      if (sortBy === "amount") {
        const numA = parseFloat(a.amount) || 0;
        const numB = parseFloat(b.amount) || 0;
        return sortOrder === "asc" ? numA - numB : numB - numA;
      } else if (sortBy === "type") {
        valA = a.type || "";
        valB = b.type || "";
      } else if (sortBy === "note") {
        valA = (a.note || "").toLowerCase();
        valB = (b.note || "").toLowerCase();
      } else if (sortBy === "category") {
        valA = (a.category?.name || "").toLowerCase();
        valB = (b.category?.name || "").toLowerCase();
      } else if (sortBy === "account") {
        valA = (a.account?.name || "").toLowerCase();
        valB = (b.account?.name || "").toLowerCase();
      }

      const cmp = String(valA).localeCompare(String(valB));
      return sortOrder === "asc" ? cmp : -cmp;
    });
  }

  // 5. Total count determination
  // If no search filter is applied, we can use the cached transactionCount from userSettings
  let totalCount = decryptedList.length;
  if (!searchQuery && !options.type && !options.accountId) {
    const settings = await getUserSettings(userId);
    if (settings.transactionCount !== totalCount) {
      await db
        .update(userSettings)
        .set({ transactionCount: totalCount.toString(), updatedAt: new Date() })
        .where(eq(userSettings.userId, userId));
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedTransactions = decryptedList.slice(startIndex, startIndex + pageSize);

  return {
    transactions: paginatedTransactions,
    totalCount,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getAllUserTransactionsForExport(userId: string) {
  const locale = await getServerLocale();
  const privKey = getActiveUserPrivateKey(userId);

  const txs = await db.query.transactions.findMany({
    where: eq(transactions.userId, userId),
    with: {
      account: true,
      toAccount: true,
      category: true,
      user: true,
    },
    orderBy: [desc(transactions.transactionDate), desc(transactions.createdAt)],
  });

  return txs.map((tx) => mapAndDecryptTransaction(tx, privKey, locale));
}

export async function createTransaction(data: {
  userId: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  amount: number;
  type: "income" | "expense" | "transfer";
  note?: string;
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
    transactionDate = new Date().toISOString().split("T")[0],
    familyId = null,
  } = data;

  if (amount <= 0) {
    throw new Error("Nominal transaksi harus lebih dari 0.");
  }

  const privKey = getActiveUserPrivateKey(userId);
  if (!privKey) {
    throw new Error("Sesi enkripsi telah berakhir. Silakan login kembali untuk mencatat transaksi.");
  }
  const publicKey = await getUserPublicKey(userId);

  // Helper to decrypt balance if encrypted
  const getPlainBalance = (storedBalance: string) => {
    if (privKey && storedBalance.startsWith("enc:v1:")) {
      try {
        return parseFloat(decryptWithPrivateKey(storedBalance, privKey));
      } catch (e) {
        console.error("Failed to decrypt balance", e);
      }
    }
    return parseFloat(storedBalance);
  };

  // Helper to encrypt with publicKey if available
  const encryptVal = (val: string) => {
    return publicKey ? encryptWithPublicKey(val, publicKey) : val;
  };

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

    const fromBalance = getPlainBalance(fromAccount.balance);
    const toBalance = getPlainBalance(toAccount.balance);

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

    const fromBalStored = encryptVal(fromNewBalance.toString());
    const toBalStored = encryptVal(toNewBalance.toString());
    const amountStored = encryptVal(amount.toString());
    const rawNote = note?.trim() || `Transfer ke ${toAccount.name}`;
    const noteStored = encryptVal(rawNote);

    let createdTx: any;

    await db.transaction(async (tx) => {
      // 1. Deduct from origin wallet
      await tx
        .update(accounts)
        .set({ balance: fromBalStored, updatedAt: new Date() })
        .where(eq(accounts.id, accountId));

      // 2. Add to destination wallet
      await tx
        .update(accounts)
        .set({ balance: toBalStored, updatedAt: new Date() })
        .where(eq(accounts.id, toAccountId));

      // 3. Persist single transfer transaction record (total balance unchanged)
      const [newTx] = await tx
        .insert(transactions)
        .values({
          userId,
          accountId,
          toAccountId,
          categoryId: categoryId || null,
          amount: amountStored,
          type: "transfer",
          note: noteStored,
          transactionDate,
        })
        .returning();

      createdTx = newTx;
    });

    await incrementUserTransactionCount(userId, 1);

    return {
      transaction: {
        ...createdTx,
        amount: amount.toString(),
        note: rawNote,
      },
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

  const currentBalance = getPlainBalance(account.balance);

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

  const newBalStored = encryptVal(newBalance.toString());
  const amountStored = encryptVal(amount.toString());
  const rawNote = note?.trim() || null;
  const noteStored = rawNote ? encryptVal(rawNote) : null;

  // 2. Persist transaction
  const [newTx] = await db
    .insert(transactions)
    .values({
      userId,
      accountId,
      toAccountId: null,
      categoryId: categoryId || null,
      amount: amountStored,
      type,
      note: noteStored,
      transactionDate,
    })
    .returning();

  // 3. Update account balance
  await db
    .update(accounts)
    .set({
      balance: newBalStored,
      updatedAt: new Date(),
    })
    .where(eq(accounts.id, accountId));

  await incrementUserTransactionCount(userId, 1);

  return {
    transaction: {
      ...newTx,
      amount: amount.toString(),
      note: rawNote,
    },
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

  const privKey = getActiveUserPrivateKey(userId);
  if (!privKey) {
    throw new Error("Sesi enkripsi telah berakhir. Silakan login kembali untuk menghapus transaksi.");
  }
  const publicKey = await getUserPublicKey(userId);

  const getPlain = (val: string) => {
    if (privKey && val.startsWith("enc:v1:")) {
      try {
        return parseFloat(decryptWithPrivateKey(val, privKey));
      } catch (e) {
        console.error("Failed to decrypt", e);
      }
    }
    return parseFloat(val);
  };

  const encryptVal = (val: string) => {
    return publicKey ? encryptWithPublicKey(val, publicKey) : val;
  };

  const txAmount = getPlain(tx.amount);

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
        const fromBal = getPlain(fromAcc.balance) + txAmount;
        await trx
          .update(accounts)
          .set({ balance: encryptVal(fromBal.toString()), updatedAt: new Date() })
          .where(eq(accounts.id, tx.accountId));
      }

      if (toAcc) {
        const toBal = getPlain(toAcc.balance) - txAmount;
        await trx
          .update(accounts)
          .set({ balance: encryptVal(toBal.toString()), updatedAt: new Date() })
          .where(eq(accounts.id, tx.toAccountId));
      }
    } else {
      // Revert income / expense
      const currentBalance = getPlain(tx.account.balance);
      const revertedBalance =
        tx.type === "income" ? currentBalance - txAmount : currentBalance + txAmount;

      await trx
        .update(accounts)
        .set({
          balance: encryptVal(revertedBalance.toString()),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, tx.accountId));
    }

    await trx
      .delete(transactions)
      .where(eq(transactions.id, transactionId));
  });

  await decrementUserTransactionCount(userId, 1);

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

  const privKey = getActiveUserPrivateKey(userId);
  if (!privKey) {
    throw new Error("Sesi enkripsi telah berakhir. Silakan login kembali untuk menghapus transaksi.");
  }
  const publicKey = await getUserPublicKey(userId);

  const getPlain = (val: string) => {
    if (privKey && val.startsWith("enc:v1:")) {
      try {
        return parseFloat(decryptWithPrivateKey(val, privKey));
      } catch (e) {
        console.error("Failed to decrypt", e);
      }
    }
    return parseFloat(val);
  };

  const encryptVal = (val: string) => {
    return publicKey ? encryptWithPublicKey(val, publicKey) : val;
  };

  await db.transaction(async (trx) => {
    // Process balance reversals per transaction
    for (const tx of txList) {
      const txAmount = getPlain(tx.amount);

      if (tx.type === "transfer" && tx.toAccountId) {
        const fromAcc = await trx.query.accounts.findFirst({
          where: eq(accounts.id, tx.accountId),
        });
        const toAcc = await trx.query.accounts.findFirst({
          where: eq(accounts.id, tx.toAccountId),
        });

        if (fromAcc) {
          const fromBal = getPlain(fromAcc.balance) + txAmount;
          await trx
            .update(accounts)
            .set({ balance: encryptVal(fromBal.toString()), updatedAt: new Date() })
            .where(eq(accounts.id, tx.accountId));
        }

        if (toAcc) {
          const toBal = getPlain(toAcc.balance) - txAmount;
          await trx
            .update(accounts)
            .set({ balance: encryptVal(toBal.toString()), updatedAt: new Date() })
            .where(eq(accounts.id, tx.toAccountId));
        }
      } else {
        const currentBal = getPlain(tx.account.balance);
        const revertedBal =
          tx.type === "income" ? currentBal - txAmount : currentBal + txAmount;

        await trx
          .update(accounts)
          .set({
            balance: encryptVal(revertedBal.toString()),
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

  await decrementUserTransactionCount(userId, txList.length);

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

  const privKey = getActiveUserPrivateKey(userId);
  if (!privKey) {
    throw new Error("Sesi enkripsi telah berakhir. Silakan login kembali untuk memperbarui transaksi.");
  }
  const publicKey = await getUserPublicKey(userId);

  const getPlain = (val: string) => {
    if (privKey && val.startsWith("enc:v1:")) {
      try {
        return parseFloat(decryptWithPrivateKey(val, privKey));
      } catch (e) {
        console.error("Failed to decrypt", e);
      }
    }
    return parseFloat(val);
  };

  const encryptVal = (val: string) => {
    return publicKey ? encryptWithPublicKey(val, publicKey) : val;
  };

  const oldAmount = getPlain(existingTx.amount);
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
        const bal = getPlain(fromAcc.balance) + oldAmount;
        await tx.update(accounts).set({ balance: encryptVal(bal.toString()), updatedAt: new Date() }).where(eq(accounts.id, oldAccountId));
      }
      if (toAcc) {
        const bal = getPlain(toAcc.balance) - oldAmount;
        await tx.update(accounts).set({ balance: encryptVal(bal.toString()), updatedAt: new Date() }).where(eq(accounts.id, oldToAccountId));
      }
    } else {
      const oldAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, oldAccountId) });
      if (oldAcc) {
        const bal = oldType === "income" ? getPlain(oldAcc.balance) - oldAmount : getPlain(oldAcc.balance) + oldAmount;
        await tx.update(accounts).set({ balance: encryptVal(bal.toString()), updatedAt: new Date() }).where(eq(accounts.id, oldAccountId));
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

      const fromBal = getPlain(fromAcc.balance) - newAmount;
      if (fromBal < 0) {
        const fmtFrom = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(getPlain(fromAcc.balance));
        const fmtAmount = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
          maximumFractionDigits: 0,
        }).format(newAmount);

        throw new Error(
          `Saldo tidak mencukupi! Saldo "${fromAcc.name}" saat ini ${fmtFrom}, tidak cukup untuk transfer sebesar ${fmtAmount}.`
        );
      }
      const toBal = getPlain(toAcc.balance) + newAmount;

      await tx.update(accounts).set({ balance: encryptVal(fromBal.toString()), updatedAt: new Date() }).where(eq(accounts.id, newAccountId));
      await tx.update(accounts).set({ balance: encryptVal(toBal.toString()), updatedAt: new Date() }).where(eq(accounts.id, newToAccountId));
    } else {
      const targetAcc = await tx.query.accounts.findFirst({ where: eq(accounts.id, newAccountId) });
      if (!targetAcc) throw new Error("Kantong tidak ditemukan.");
      const currentBal = getPlain(targetAcc.balance);

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
      await tx.update(accounts).set({ balance: encryptVal(newBal.toString()), updatedAt: new Date() }).where(eq(accounts.id, newAccountId));
    }

    // 3. Update transaction record
    const updatePayload: Record<string, any> = {
      amount: encryptVal(newAmount.toString()),
      type: newType,
      accountId: newAccountId,
      toAccountId: newType === "transfer" ? newToAccountId : null,
      categoryId: newType === "transfer" ? null : categoryId,
      updatedAt: new Date(),
    };
    if (note !== undefined) updatePayload.note = note ? encryptVal(note.trim()) : null;
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

  const privKey = getActiveUserPrivateKey(userId);
  if (!privKey) {
    throw new Error("Sesi enkripsi telah berakhir. Silakan login kembali untuk mengimpor transaksi.");
  }
  const publicKey = await getUserPublicKey(userId);

  const getPlain = (val: string) => {
    if (privKey && val.startsWith("enc:v1:")) {
      try {
        return parseFloat(decryptWithPrivateKey(val, privKey));
      } catch (e) {
        console.error("Failed to decrypt", e);
      }
    }
    return parseFloat(val);
  };

  const encryptVal = (val: string) => {
    return publicKey ? encryptWithPublicKey(val, publicKey) : val;
  };

  const result = await db.transaction(async (tx) => {
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

        const fromBal = getPlain(fromAcc.balance) - item.amount;
        const toBal = getPlain(toAcc.balance) + item.amount;

        await tx
          .update(accounts)
          .set({ balance: encryptVal(fromBal.toString()), updatedAt: new Date() })
          .where(eq(accounts.id, item.accountId));
        await tx
          .update(accounts)
          .set({ balance: encryptVal(toBal.toString()), updatedAt: new Date() })
          .where(eq(accounts.id, item.toAccountId));

        await tx.insert(transactions).values({
          userId,
          accountId: item.accountId,
          toAccountId: item.toAccountId,
          categoryId: null,
          amount: encryptVal(item.amount.toString()),
          type: "transfer",
          note: item.note ? encryptVal(item.note.trim()) : null,
          transactionDate: item.transactionDate,
        });
        imported++;
      } else {
        const acc = await tx.query.accounts.findFirst({
          where: eq(accounts.id, item.accountId),
        });
        if (!acc) continue;

        const currentBal = getPlain(acc.balance);
        const newBal =
          item.type === "income" ? currentBal + item.amount : currentBal - item.amount;

        await tx
          .update(accounts)
          .set({ balance: encryptVal(newBal.toString()), updatedAt: new Date() })
          .where(eq(accounts.id, item.accountId));

        await tx.insert(transactions).values({
          userId,
          accountId: item.accountId,
          toAccountId: null,
          categoryId: item.categoryId || null,
          amount: encryptVal(item.amount.toString()),
          type: item.type,
          note: item.note ? encryptVal(item.note.trim()) : null,
          transactionDate: item.transactionDate,
        });
        imported++;
      }
    }

    return { success: true, count: imported };
  });

  if (result.count > 0) {
    await incrementUserTransactionCount(userId, result.count);
  }

  return result;
}


