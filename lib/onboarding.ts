import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export interface OnboardUserInput {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  initialCashBalance?: number;
  initialBankBalance?: number;
  initialEwalletBalance?: number;
}

export interface OnboardUserResult {
  success: boolean;
  message: string;
  isNewUser: boolean;
  user: typeof users.$inferSelect;
  accounts: (typeof accounts.$inferSelect)[];
}

/**
 * Logika onboarding bersama untuk Web dan Telegram.
 */
export async function onboardUser(input: OnboardUserInput): Promise<OnboardUserResult> {
  const {
    fullName,
    email: rawEmail,
    phone,
    telegramId,
    telegramUsername,
    initialCashBalance = 0,
    initialBankBalance = 0,
    initialEwalletBalance = 0,
  } = input;

  const email = rawEmail?.trim().toLowerCase() || null;

  try {
    // 1. Cari user yang sudah ada (berdasarkan telegramId atau email)
    let existingUser: typeof users.$inferSelect | undefined;

    if (telegramId) {
      existingUser = await db.query.users.findFirst({
        where: eq(users.telegramId, telegramId),
      });
    }

    if (!existingUser && telegramUsername) {
      existingUser = await db.query.users.findFirst({
        where: eq(users.telegramUsername, telegramUsername),
      });
    }

    if (!existingUser && email) {
      existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
    }

    if (!existingUser && fullName && fullName !== "Sobat Fana") {
      existingUser = await db.query.users.findFirst({
        where: eq(users.fullName, fullName),
      });
    }

    let currentUser: typeof users.$inferSelect;
    let isNew = false;

    if (existingUser) {
      // User sudah ada -> Perbarui info jika ada penambahan (misal telegramId atau nama)
      const updateData: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (telegramId && !existingUser.telegramId) {
        updateData.telegramId = telegramId;
      }
      if (telegramUsername && !existingUser.telegramUsername) {
        updateData.telegramUsername = telegramUsername;
      }
      if (fullName && (!existingUser.fullName || existingUser.fullName === "Sobat Fana")) {
        updateData.fullName = fullName;
      }
      if (phone && !existingUser.phone) {
        updateData.phone = phone;
      }

      if (Object.keys(updateData).length > 1) {
        const [updated] = await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, existingUser.id))
          .returning();
        currentUser = updated;
      } else {
        currentUser = existingUser;
      }
    } else {
      // User baru
      isNew = true;
      // Database email NOT NULL: jika daftar via telegram tanpa email, generate email placeholder
      const userEmail = email || `tg_${telegramId || Date.now()}@fana.app`;

      const [newUser] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          fullName: fullName || "Sobat Fana",
          email: userEmail,
          phone: phone || null,
          telegramId: telegramId || null,
          telegramUsername: telegramUsername || null,
        })
        .returning();

      currentUser = newUser;
    }

    // 2. Cek dan pastikan template dompet default tersedia (Cash, Bank, e-Wallet)
    let userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, currentUser.id),
    });

    if (userAccounts.length === 0) {
      const defaultWallets = [
        {
          userId: currentUser.id,
          name: "Cash (Dompet Tunai)",
          type: "cash",
          balance: Math.max(0, initialCashBalance).toString(),
          currency: "IDR",
          isDefault: true,
        },
        {
          userId: currentUser.id,
          name: "Rekening Bank",
          type: "bank",
          balance: Math.max(0, initialBankBalance).toString(),
          currency: "IDR",
          isDefault: false,
        },
        {
          userId: currentUser.id,
          name: "e-Wallet (GoPay/OVO)",
          type: "ewallet",
          balance: Math.max(0, initialEwalletBalance).toString(),
          currency: "IDR",
          isDefault: false,
        },
      ];

      userAccounts = await db.insert(accounts).values(defaultWallets).returning();
    }

    return {
      success: true,
      message: isNew
        ? "Akun baru berhasil dibuat beserta dompet default."
        : "Selamat datang kembali di Fana!",
      isNewUser: isNew,
      user: currentUser,
      accounts: userAccounts,
    };
  } catch (error: any) {
    console.error("Gagal melakukan onboarding user:", error);
    throw error;
  }
}
