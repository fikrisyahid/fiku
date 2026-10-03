"use server";

import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { eq, or, and, isNull } from "drizzle-orm";

export async function getCategories(userId?: string, familyId?: string | null) {
  // Ambil kategori default sistem (userId null / isDefault true) + kategori custom di scope ini
  if (familyId) {
    return await db.query.categories.findMany({
      where: or(
        and(isNull(categories.userId), isNull(categories.familyId)),
        eq(categories.familyId, familyId)
      ),
      orderBy: (cat, { asc }) => [asc(cat.type), asc(cat.name)],
    });
  }

  if (userId) {
    return await db.query.categories.findMany({
      where: or(
        and(isNull(categories.userId), isNull(categories.familyId)),
        and(eq(categories.userId, userId), isNull(categories.familyId))
      ),
      orderBy: (cat, { asc }) => [asc(cat.type), asc(cat.name)],
    });
  }

  return await db.query.categories.findMany({
    where: and(isNull(categories.userId), isNull(categories.familyId)),
    orderBy: (cat, { asc }) => [asc(cat.type), asc(cat.name)],
  });
}

export async function createCategory(data: {
  userId: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  familyId?: string | null;
}) {
  const { userId, name, type, icon, familyId = null } = data;

  const [newCategory] = await db
    .insert(categories)
    .values({
      userId,
      familyId,
      name: name.trim(),
      type,
      icon: icon || (type === "income" ? "💰" : "💸"),
      isDefault: false,
    })
    .returning();

  return newCategory;
}

export async function deleteCategory(
  categoryId: string,
  userId: string,
  familyId?: string | null
) {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!cat) {
    throw new Error("Kategori tidak ditemukan.");
  }

  if (cat.isDefault || (!cat.userId && !cat.familyId)) {
    throw new Error("Kategori bawaan sistem tidak dapat dihapus!");
  }

  if (familyId) {
    if (cat.familyId !== familyId) {
      throw new Error("Kamu tidak memiliki izin untuk menghapus kategori keluarga ini.");
    }
  } else {
    if (cat.userId !== userId || cat.familyId) {
      throw new Error("Kamu tidak memiliki izin untuk menghapus kategori ini.");
    }
  }

  // Cek apakah ada transaksi yang menggunakan kategori ini
  const txFilter = familyId
    ? and(eq(transactions.categoryId, categoryId), eq(transactions.familyId, familyId))
    : and(eq(transactions.categoryId, categoryId), eq(transactions.userId, userId), isNull(transactions.familyId));

  const tx = await db.query.transactions.findFirst({
    where: txFilter,
  });

  if (tx) {
    throw new Error(
      `Kategori "${cat.name}" tidak dapat dihapus karena sudah dipakai dalam riwayat transaksi. Kamu bisa mengedit namanya dengan /edit_kategori.`
    );
  }

  const deleteFilter = familyId
    ? and(eq(categories.id, categoryId), eq(categories.familyId, familyId))
    : and(eq(categories.id, categoryId), eq(categories.userId, userId), isNull(categories.familyId));

  const [deleted] = await db
    .delete(categories)
    .where(deleteFilter)
    .returning();

  return deleted;
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  data: {
    name?: string;
    type?: "income" | "expense";
    icon?: string;
  },
  familyId?: string | null
) {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!cat) {
    throw new Error("Kategori tidak ditemukan.");
  }

  if (cat.isDefault || (!cat.userId && !cat.familyId)) {
    throw new Error("Kategori bawaan sistem tidak dapat diubah!");
  }

  if (familyId) {
    if (cat.familyId !== familyId) {
      throw new Error("Kamu tidak memiliki izin untuk mengubah kategori keluarga ini.");
    }
  } else {
    if (cat.userId !== userId || cat.familyId) {
      throw new Error("Kamu tidak memiliki izin untuk mengubah kategori ini.");
    }
  }

  const updateValues: Partial<typeof categories.$inferInsert> = {};
  if (data.name !== undefined) updateValues.name = data.name.trim();
  if (data.type !== undefined) updateValues.type = data.type;
  if (data.icon !== undefined) updateValues.icon = data.icon.trim();

  const updateFilter = familyId
    ? and(eq(categories.id, categoryId), eq(categories.familyId, familyId))
    : and(eq(categories.id, categoryId), eq(categories.userId, userId), isNull(categories.familyId));

  const [updated] = await db
    .update(categories)
    .set(updateValues)
    .where(updateFilter)
    .returning();

  return updated;
}
