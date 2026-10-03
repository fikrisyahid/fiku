"use server";

import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, or, and, isNull } from "drizzle-orm";

export async function getCategories(userId?: string) {
  // Ambil kategori default sistem (userId null / isDefault true) + kategori custom milik user
  if (userId) {
    return await db.query.categories.findMany({
      where: or(isNull(categories.userId), eq(categories.userId, userId)),
      orderBy: (cat, { asc }) => [asc(cat.type), asc(cat.name)],
    });
  }

  return await db.query.categories.findMany({
    where: isNull(categories.userId),
    orderBy: (cat, { asc }) => [asc(cat.type), asc(cat.name)],
  });
}

export async function createCategory(data: {
  userId: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
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

export async function deleteCategory(categoryId: string, userId: string) {
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

  const [deleted] = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return deleted;
}
