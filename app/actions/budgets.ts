"use server";

import { db } from "@/db";
import { budgets, transactions } from "@/db/schema";
import { eq, and, isNull, gte, lte, sql } from "drizzle-orm";

export interface BudgetWithProgress {
  id: string;
  name: string | null;
  amountLimit: string;
  periodStart: string;
  periodEnd: string;
  notes: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    type: string;
  } | null;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  isActive: boolean;
}

export async function getUserBudgets(
  userId: string,
  familyId?: string | null
): Promise<BudgetWithProgress[]> {
  const budgetWhere = familyId
    ? eq(budgets.familyId, familyId)
    : and(eq(budgets.userId, userId), isNull(budgets.familyId));

  const userBudgets = await db.query.budgets.findMany({
    where: budgetWhere,
    with: {
      category: true,
    },
    orderBy: (b, { desc }) => [desc(b.createdAt)],
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const results: BudgetWithProgress[] = [];

  for (const b of userBudgets) {
    // Hitung total pengeluaran untuk kategori ini dalam rentang waktu periode budget
    const txConditions = [
      eq(transactions.type, "expense"),
      eq(transactions.categoryId, b.categoryId),
      gte(transactions.transactionDate, b.periodStart),
      lte(transactions.transactionDate, b.periodEnd),
    ];

    if (familyId) {
      txConditions.push(eq(transactions.familyId, familyId));
    } else {
      txConditions.push(eq(transactions.userId, userId));
      txConditions.push(isNull(transactions.familyId));
    }

    const [spentResult] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(...txConditions));

    const spent = parseFloat(spentResult?.total || "0");
    const limit = parseFloat(b.amountLimit);
    const remaining = limit - spent;
    const percentage = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
    const isActive = todayStr >= b.periodStart && todayStr <= b.periodEnd;

    results.push({
      id: b.id,
      name: b.name,
      amountLimit: b.amountLimit,
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
      notes: b.notes,
      category: b.category,
      spentAmount: spent,
      remainingAmount: remaining,
      percentageUsed: percentage,
      isActive,
    });
  }

  return results;
}

export async function createBudget(data: {
  userId: string;
  categoryId: string;
  name?: string;
  amountLimit: number;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;   // YYYY-MM-DD
  notes?: string;
  familyId?: string | null;
}) {
  const {
    userId,
    categoryId,
    name,
    amountLimit,
    periodStart,
    periodEnd,
    notes,
    familyId = null,
  } = data;

  if (amountLimit <= 0) {
    throw new Error("Target alokasi dana harus lebih dari 0.");
  }

  if (periodEnd < periodStart) {
    throw new Error("Tanggal akhir alokasi tidak boleh lebih awal dari tanggal mulai.");
  }

  const [newBudget] = await db
    .insert(budgets)
    .values({
      userId,
      familyId,
      categoryId,
      name: name?.trim() || null,
      amountLimit: amountLimit.toString(),
      periodStart,
      periodEnd,
      notes: notes?.trim() || null,
    })
    .returning();

  return newBudget;
}

export async function deleteBudget(
  budgetId: string,
  userId: string,
  familyId?: string | null
) {
  const deleteWhere = familyId
    ? and(eq(budgets.id, budgetId), eq(budgets.familyId, familyId))
    : and(eq(budgets.id, budgetId), eq(budgets.userId, userId), isNull(budgets.familyId));

  const [deleted] = await db
    .delete(budgets)
    .where(deleteWhere)
    .returning();

  if (!deleted) {
    throw new Error("Alokasi dana tidak ditemukan.");
  }

  return deleted;
}
