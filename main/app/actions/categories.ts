"use server";

import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { eq, or, and, isNull } from "drizzle-orm";

import { getServerLocale } from "@/lib/i18n/server";
import { translateCategoryName } from "@/lib/i18n/dictionary";

export async function getCategories(userId?: string, _familyId?: string | null) {
  const locale = await getServerLocale();

  let results;
  // Ambil kategori default sistem (userId null / isDefault true) + kategori custom milik user
  if (userId) {
    results = await db.query.categories.findMany({
      where: or(
        isNull(categories.userId),
        eq(categories.userId, userId)
      ),
      orderBy: (cat, { asc }) => [asc(cat.type), asc(cat.name)],
    });
  } else {
    results = await db.query.categories.findMany({
      where: isNull(categories.userId),
      orderBy: (cat, { asc }) => [asc(cat.type), asc(cat.name)],
    });
  }

  return results.map((cat) => ({
    ...cat,
    name: translateCategoryName(cat.name, locale),
    rawName: cat.name,
  }));
}

export async function createCategory(data: {
  userId: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  familyId?: string | null;
}) {
  const { userId, name, type, icon } = data;

  const [newCategory] = await db
    .insert(categories)
    .values({
      userId,
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
  _familyId?: string | null
) {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!cat) {
    throw new Error("Kategori tidak ditemukan.");
  }

  if (cat.isDefault || !cat.userId) {
    throw new Error("Kategori bawaan sistem tidak dapat dihapus!");
  }

  if (cat.userId !== userId) {
    throw new Error("Kamu tidak memiliki izin untuk menghapus kategori ini.");
  }

  // Cek apakah ada transaksi yang menggunakan kategori ini
  const tx = await db.query.transactions.findFirst({
    where: and(eq(transactions.categoryId, categoryId), eq(transactions.userId, userId)),
  });

  if (tx) {
    throw new Error(
      `Kategori "${cat.name}" tidak dapat dihapus karena sudah dipakai dalam riwayat transaksi.`
    );
  }

  const [deleted] = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
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
  _familyId?: string | null
) {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!cat) {
    throw new Error("Kategori tidak ditemukan.");
  }

  if (cat.isDefault || !cat.userId) {
    throw new Error("Kategori bawaan sistem tidak dapat diubah!");
  }

  if (cat.userId !== userId) {
    throw new Error("Kamu tidak memiliki izin untuk mengubah kategori ini.");
  }

  const updateValues: Partial<typeof categories.$inferInsert> = {};
  if (data.name !== undefined) updateValues.name = data.name.trim();
  if (data.type !== undefined) updateValues.type = data.type;
  if (data.icon !== undefined) updateValues.icon = data.icon.trim();

  const [updated] = await db
    .update(categories)
    .set(updateValues)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return updated;
}
