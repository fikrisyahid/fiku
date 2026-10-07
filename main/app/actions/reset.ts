"use server";

import { db } from "@/db";
import { users, accounts, transactions, budgets, debts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { lockUserSession } from "@/lib/crypto";

/**
 * Permanently wipes out all data belonging to a user:
 * Transactions, Wallets, Budgets, Debts, and User Profile.
 */
export async function wipeoutUserData(userId: string) {
  // 0. Evict in-memory encryption RAM session
  lockUserSession(userId);

  // 1. Delete transactions first
  await db.delete(transactions).where(eq(transactions.userId, userId));

  // 2. Delete budget allocations
  await db.delete(budgets).where(eq(budgets.userId, userId));

  // 3. Delete debts and receivables
  await db.delete(debts).where(eq(debts.userId, userId));

  // 4. Delete financial accounts and wallets
  await db.delete(accounts).where(eq(accounts.userId, userId));

  // 5. Delete user account record
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning();

  return deletedUser;
}
