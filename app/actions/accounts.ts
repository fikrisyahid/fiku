"use server";

import { db } from "@/db";
import { accounts, transactions, categories } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

export async function getUserAccounts(userId: string) {
  return await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
    orderBy: (acc, { desc, asc }) => [desc(acc.isDefault), asc(acc.createdAt)],
  });
}

export async function getAccountById(accountId: string, userId: string) {
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
}) {
  const { userId, name, type, balance = 0, currency = "IDR", isDefault = false } = data;

  if (isDefault) {
    // Jika dompet ini dijadikan default, lepas default dari dompet lainnya
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
  }
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

export async function deleteAccount(accountId: string, userId: string) {
  const account = await getAccountById(accountId, userId);
  if (!account) {
    throw new Error("Dompet tidak ditemukan.");
  }

  // Cek apakah akun memiliki transaksi
  const tx = await db.query.transactions.findFirst({
    where: and(eq(transactions.accountId, accountId), eq(transactions.userId, userId)),
  });

  if (tx) {
    throw new Error(
      `Dompet "${account.name}" tidak dapat dihapus karena sudah memiliki riwayat transaksi. Kamu bisa mengedit namanya atau mentransfer saldonya ke dompet lain.`
    );
  }

  // Cek jika ini satu-satunya dompet
  const allUserAccounts = await getUserAccounts(userId);
  if (allUserAccounts.length <= 1) {
    throw new Error("Kamu tidak bisa menghapus dompet terakhirmu!");
  }

  const [deleted] = await db
    .delete(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();

  // Jika yang dihapus adalah dompet utama, set dompet lain yang tersisa sebagai utama
  if (deleted.isDefault) {
    const remaining = allUserAccounts.find((a) => a.id !== deleted.id);
    if (remaining) {
      await setDefaultAccount(remaining.id, userId);
    }
  }

  return deleted;
}

export async function setDefaultAccount(accountId: string, userId: string) {
  // 1. Lepas status isDefault dari semua dompet milik user
  await db
    .update(accounts)
    .set({ isDefault: false, updatedAt: new Date() })
    .where(eq(accounts.userId, userId));

  // 2. Set dompet terpilih menjadi default
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
}) {
  const {
    userId,
    fromAccountId,
    toAccountId,
    amount,
    note,
    source = "telegram",
    transactionDate = new Date().toISOString().split("T")[0],
  } = data;

  if (amount <= 0) {
    throw new Error("Nominal transfer harus lebih dari 0.");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("Dompet asal dan dompet tujuan tidak boleh sama!");
  }

  const fromAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, fromAccountId), eq(accounts.userId, userId)),
  });
  if (!fromAccount) {
    throw new Error("Dompet asal tidak ditemukan.");
  }

  const toAccount = await db.query.accounts.findFirst({
    where: and(eq(accounts.id, toAccountId), eq(accounts.userId, userId)),
  });
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

  // Cari kategori untuk mencatat mutasi transfer
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
    // 1. Kurangi saldo dompet asal
    await tx
      .update(accounts)
      .set({ balance: fromNewBalance.toString(), updatedAt: new Date() })
      .where(eq(accounts.id, fromAccountId));

    // 2. Tambah saldo dompet tujuan
    await tx
      .update(accounts)
      .set({ balance: toNewBalance.toString(), updatedAt: new Date() })
      .where(eq(accounts.id, toAccountId));

    // 3. Catat transaksi keluar di dompet asal
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

    // 4. Catat transaksi masuk di dompet tujuan
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
