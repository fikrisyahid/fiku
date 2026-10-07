"use server";

import { db } from "@/db";
import { accounts, transactions, categories } from "@/db/schema";
import { eq, and, or, isNull } from "drizzle-orm";

export async function getUserAccounts(userId: string, familyId?: string | null) {
  if (familyId) {
    return await db.query.accounts.findMany({
      where: eq(accounts.familyId, familyId),
      orderBy: (acc, { desc, asc }) => [desc(acc.isDefault), asc(acc.createdAt)],
    });
  }

  return await db.query.accounts.findMany({
    where: and(eq(accounts.userId, userId), isNull(accounts.familyId)),
    orderBy: (acc, { desc, asc }) => [desc(acc.isDefault), asc(acc.createdAt)],
  });
}

export async function getAccountById(
  accountId: string,
  userId: string,
  familyId?: string | null
) {
  const whereCondition = familyId
    ? and(eq(accounts.id, accountId), eq(accounts.familyId, familyId))
    : and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.familyId));

  return await db.query.accounts.findFirst({
    where: whereCondition,
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
    familyId = null,
  } = data;

  if (isDefault) {
    // Jika dompet ini dijadikan default, lepas default dari dompet lainnya di scope yang sama
    if (familyId) {
      await db
        .update(accounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(accounts.familyId, familyId));
    } else {
      await db
        .update(accounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(accounts.userId, userId), isNull(accounts.familyId)));
    }
  }

  const [newAccount] = await db
    .insert(accounts)
    .values({
      userId,
      familyId,
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
  familyId?: string | null
) {
  if (data.isDefault) {
    if (familyId) {
      await db
        .update(accounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(accounts.familyId, familyId));
    } else {
      await db
        .update(accounts)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(accounts.userId, userId), isNull(accounts.familyId)));
    }
  }

  const updateValues: Partial<typeof accounts.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateValues.name = data.name.trim();
  if (data.type !== undefined) updateValues.type = data.type.toLowerCase();
  if (data.balance !== undefined) updateValues.balance = data.balance.toString();
  if (data.isDefault !== undefined) updateValues.isDefault = data.isDefault;

  const whereCondition = familyId
    ? and(eq(accounts.id, accountId), eq(accounts.familyId, familyId))
    : and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.familyId));

  const [updated] = await db
    .update(accounts)
    .set(updateValues)
    .where(whereCondition)
    .returning();

  return updated;
}

export async function deleteAccount(
  accountId: string,
  userId: string,
  familyId?: string | null
) {
  const account = await getAccountById(accountId, userId, familyId);
  if (!account) {
    throw new Error("Dompet tidak ditemukan.");
  }

  // Cek apakah akun memiliki transaksi
  const tx = await db.query.transactions.findFirst({
    where: eq(transactions.accountId, accountId),
  });

  if (tx) {
    throw new Error(
      `Dompet "${account.name}" tidak dapat dihapus karena sudah memiliki riwayat transaksi. Kamu bisa mengedit namanya atau mentransfer saldonya ke dompet lain.`
    );
  }

  // Cek jika ini satu-satunya dompet di scope ini
  const allAccounts = await getUserAccounts(userId, familyId);
  if (allAccounts.length <= 1) {
    throw new Error("Kamu tidak bisa menghapus dompet terakhirmu!");
  }

  const [deleted] = await db
    .delete(accounts)
    .where(eq(accounts.id, accountId))
    .returning();

  // Jika yang dihapus adalah dompet utama, set dompet lain yang tersisa sebagai utama
  if (deleted.isDefault) {
    const remaining = allAccounts.find((a) => a.id !== deleted.id);
    if (remaining) {
      await setDefaultAccount(remaining.id, userId, familyId);
    }
  }

  return deleted;
}

export async function setDefaultAccount(
  accountId: string,
  userId: string,
  familyId?: string | null
) {
  if (familyId) {
    // 1. Lepas status isDefault dari semua dompet di keluarga
    await db
      .update(accounts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(eq(accounts.familyId, familyId));

    // 2. Set dompet terpilih menjadi default
    const [updated] = await db
      .update(accounts)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(accounts.id, accountId), eq(accounts.familyId, familyId)))
      .returning();

    if (!updated) {
      throw new Error("Dompet tidak ditemukan.");
    }

    return updated;
  } else {
    // 1. Lepas status isDefault dari semua dompet personal user
    await db
      .update(accounts)
      .set({ isDefault: false, updatedAt: new Date() })
      .where(and(eq(accounts.userId, userId), isNull(accounts.familyId)));

    // 2. Set dompet terpilih menjadi default
    const [updated] = await db
      .update(accounts)
      .set({ isDefault: true, updatedAt: new Date() })
      .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId), isNull(accounts.familyId)))
      .returning();

    if (!updated) {
      throw new Error("Dompet tidak ditemukan.");
    }

    return updated;
  }
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
    source = "telegram",
    transactionDate = new Date().toISOString().split("T")[0],
    familyId = null,
  } = data;

  if (amount <= 0) {
    throw new Error("Nominal transfer harus lebih dari 0.");
  }

  if (fromAccountId === toAccountId) {
    throw new Error("Dompet asal dan dompet tujuan tidak boleh sama!");
  }

  const fromAccount = await getAccountById(fromAccountId, userId, familyId);
  if (!fromAccount) {
    throw new Error("Dompet asal tidak ditemukan.");
  }

  const toAccount = await getAccountById(toAccountId, userId, familyId);
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
  const categoryFilter = familyId
    ? or(isNull(categories.userId), eq(categories.familyId, familyId))
    : or(isNull(categories.userId), eq(categories.userId, userId));

  const allCategories = await db.query.categories.findMany({
    where: categoryFilter,
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
      familyId,
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
      familyId,
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
