"use server";

import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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

  const [deleted] = await db
    .delete(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)))
    .returning();

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
