"use server";

import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export type OnboardingResult = {
  success: boolean;
  message: string;
  user?: typeof users.$inferSelect;
  account?: typeof accounts.$inferSelect;
};

export async function submitWebOnboarding(formData: FormData): Promise<OnboardingResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;
  const walletName = (formData.get("walletName") as string)?.trim() || "Cash";
  const walletType = (formData.get("walletType") as string)?.trim() || "cash";
  const initialBalanceRaw = (formData.get("initialBalance") as string)?.trim() || "0";
  const initialBalance = parseFloat(initialBalanceRaw.replace(/[^0-9.-]/g, "")) || 0;

  if (!fullName || !email) {
    return { success: false, message: "Nama lengkap dan email wajib diisi!" };
  }

  try {
    // 1. Cek apakah user sudah terdaftar
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    let currentUser: typeof users.$inferSelect;

    if (existingUser) {
      const [updated] = await db
        .update(users)
        .set({
          fullName,
          phone: phone || existingUser.phone,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      currentUser = updated;
    } else {
      const [newUser] = await db
        .insert(users)
        .values({
          fullName,
          email,
          phone,
        })
        .returning();
      currentUser = newUser;
    }

    // 2. Cek apakah sudah ada dompet / akun keuangan
    let userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, currentUser.id),
    });

    if (!userAccount) {
      const [newAccount] = await db
        .insert(accounts)
        .values({
          userId: currentUser.id,
          name: walletName,
          type: walletType,
          balance: initialBalance.toString(),
          currency: "IDR",
          isDefault: true,
        })
        .returning();
      userAccount = newAccount;
    }

    return {
      success: true,
      message: "Selamat! Profil dan dompet keuangan kamu berhasil dibuat.",
      user: currentUser,
      account: userAccount,
    };
  } catch (err: any) {
    console.error("Error onboarding web:", err);
    return {
      success: false,
      message: err?.message || "Gagal menyimpan data onboarding.",
    };
  }
}
