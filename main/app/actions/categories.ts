"use server";

import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { eq, or, and, isNull } from "drizzle-orm";

import { getServerLocale } from "@/lib/i18n/server";
import { translateCategoryName } from "@/lib/i18n/dictionary";
import {
  encryptWithPublicKey,
  decryptWithPrivateKey,
  getActiveUserPrivateKey,
  getUserPublicKey,
} from "@/lib/crypto";

export async function getCategories(userId?: string, _familyId?: string | null) {
  const locale = await getServerLocale();
  const privKey = userId ? await getActiveUserPrivateKey(userId) : null;

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

  return results.map((cat) => {
    let plainName = cat.name;
    if (privKey && cat.name.startsWith("enc:v1:")) {
      try {
        plainName = decryptWithPrivateKey(cat.name, privKey);
      } catch (e) {
        console.error("Failed to decrypt category name for category", cat.id, e);
      }
    }

    return {
      ...cat,
      name: translateCategoryName(plainName, locale),
      rawName: plainName,
    };
  });
}

export async function createCategory(data: {
  userId: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  familyId?: string | null;
}) {
  const { userId, name, type, icon } = data;
  const publicKey = await getUserPublicKey(userId);
  const trimmedName = name.trim();
  const storedName = publicKey ? encryptWithPublicKey(trimmedName, publicKey) : trimmedName;

  const [newCategory] = await db
    .insert(categories)
    .values({
      userId,
      name: storedName,
      type,
      icon: icon || (type === "income" ? "💰" : "💸"),
      isDefault: false,
    })
    .returning();

  return {
    ...newCategory,
    name: trimmedName,
  };
}

export async function deleteCategory(
  categoryId: string,
  userId: string,
  _familyId?: string | null
): Promise<{ success: true; data: any } | { success: false; error: string; data?: never }> {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!cat) {
    return { success: false, error: "Kategori tidak ditemukan." };
  }

  if (cat.isDefault || !cat.userId) {
    return { success: false, error: "Kategori bawaan sistem tidak dapat dihapus!" };
  }

  if (cat.userId !== userId) {
    return { success: false, error: "Kamu tidak memiliki izin untuk menghapus kategori ini." };
  }

  // Cek apakah ada transaksi yang menggunakan kategori ini
  const tx = await db.query.transactions.findFirst({
    where: and(eq(transactions.categoryId, categoryId), eq(transactions.userId, userId)),
  });

  if (tx) {
    return {
      success: false,
      error: `Kategori "${cat.name}" tidak dapat dihapus karena sudah dipakai dalam riwayat transaksi.`,
    };
  }

  const [deleted] = await db
    .delete(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return { success: true, data: deleted };
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
): Promise<{ success: true; data: any } | { success: false; error: string; data?: never }> {
  const cat = await db.query.categories.findFirst({
    where: eq(categories.id, categoryId),
  });

  if (!cat) {
    return { success: false, error: "Kategori tidak ditemukan." };
  }

  if (cat.isDefault || !cat.userId) {
    return { success: false, error: "Kategori bawaan sistem tidak dapat diubah!" };
  }

  if (cat.userId !== userId) {
    return { success: false, error: "Kamu tidak memiliki izin untuk mengubah kategori ini." };
  }

  const updateValues: Partial<typeof categories.$inferInsert> = {};
  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    const publicKey = await getUserPublicKey(userId);
    updateValues.name = publicKey ? encryptWithPublicKey(trimmed, publicKey) : trimmed;
  }
  if (data.type !== undefined) updateValues.type = data.type;
  if (data.icon !== undefined) updateValues.icon = data.icon.trim();

  const [updated] = await db
    .update(categories)
    .set(updateValues)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();

  return {
    success: true,
    data: {
      ...updated,
      name: data.name !== undefined ? data.name.trim() : updated.name,
    },
  };
}
