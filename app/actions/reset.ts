"use server";

import { db } from "@/db";
import { users, accounts, transactions, budgets, debts } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Menghapus seluruh data pengguna secara permanen (wipeout):
 * Transaksi, Dompet, Budget, Utang, dan Profil User.
 */
export async function wipeoutUserData(userId: string) {
  // 1. Hapus transactions terlebih dahulu
  await db.delete(transactions).where(eq(transactions.userId, userId));

  // 2. Hapus budgets / alokasi dana
  await db.delete(budgets).where(eq(budgets.userId, userId));

  // 3. Hapus debts / utang-piutang
  await db.delete(debts).where(eq(debts.userId, userId));

  // 4. Hapus accounts / dompet
  await db.delete(accounts).where(eq(accounts.userId, userId));

  // 5. Hapus akun pengguna
  const [deletedUser] = await db
    .delete(users)
    .where(eq(users.id, userId))
    .returning();

  return deletedUser;
}
