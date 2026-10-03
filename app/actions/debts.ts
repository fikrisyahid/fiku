"use server";

import { db } from "@/db";
import { debts } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getUserDebts(userId: string, isSettled?: boolean) {
  return await db.query.debts.findMany({
    where: (d, { eq: eqField, and: andFields }) => {
      const conditions = [eqField(d.userId, userId)];
      if (isSettled !== undefined) {
        conditions.push(eqField(d.isSettled, isSettled));
      }
      return andFields(...conditions);
    },
    orderBy: [desc(debts.createdAt)],
  });
}

export async function createDebt(data: {
  userId: string;
  contactName: string;
  amount: number;
  type: "owed_by_me" | "owed_to_me"; // owed_by_me = utang kita, owed_to_me = piutang
  dueDate?: string; // YYYY-MM-DD
  note?: string;
}) {
  const { userId, contactName, amount, type, dueDate, note } = data;

  if (amount <= 0) {
    throw new Error("Nominal utang/piutang harus lebih dari 0.");
  }

  const [newDebt] = await db
    .insert(debts)
    .values({
      userId,
      contactName: contactName.trim(),
      amount: amount.toString(),
      type,
      dueDate: dueDate || null,
      note: note?.trim() || null,
      isSettled: false,
    })
    .returning();

  return newDebt;
}

export async function settleDebt(debtId: string, userId: string) {
  const [updated] = await db
    .update(debts)
    .set({
      isSettled: true,
      updatedAt: new Date(),
    })
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  if (!updated) {
    throw new Error("Catatan utang/piutang tidak ditemukan.");
  }

  return updated;
}

export async function deleteDebt(debtId: string, userId: string) {
  const [deleted] = await db
    .delete(debts)
    .where(and(eq(debts.id, debtId), eq(debts.userId, userId)))
    .returning();

  if (!deleted) {
    throw new Error("Catatan utang/piutang tidak ditemukan.");
  }

  return deleted;
}
