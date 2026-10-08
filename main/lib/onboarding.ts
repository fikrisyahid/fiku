import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

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
 * Shared onboarding logic for Web and Telegram integrations.
 */
export async function onboardUser(input: OnboardUserInput): Promise<OnboardUserResult> {
  const {
    fullName,
    email: rawEmail,
    phone,
    telegramId,
    telegramUsername,
  } = input;

  const email = rawEmail?.trim().toLowerCase() || null;

  try {
    // 1. Check for existing user (by telegramId, telegramUsername, or email)
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

    let currentUser: typeof users.$inferSelect;
    let isNew = false;

    if (existingUser) {
      // User exists -> update profile information if additional data provided
      const updateData: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (email && existingUser.email.startsWith("tg_")) {
        updateData.email = email;
      }
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
      // Create new user record
      isNew = true;
      // Database email column is NOT NULL: generate placeholder if registered via Telegram without email
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

    // 2. Ensure starter default wallets exist (Cash, Bank, e-Wallet)
    let userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, currentUser.id),
    });

    if (userAccounts.length === 0) {
      const defaultWallets = [
        {
          userId: currentUser.id,
          name: "Cash (Dompet Tunai)",
          type: "cash",
          balance: "0",
          currency: "IDR",
          isDefault: true,
        },
        {
          userId: currentUser.id,
          name: "Rekening Bank",
          type: "bank",
          balance: "0",
          currency: "IDR",
          isDefault: false,
        },
        {
          userId: currentUser.id,
          name: "e-Wallet (GoPay/OVO)",
          type: "ewallet",
          balance: "0",
          currency: "IDR",
          isDefault: false,
        },
      ];

      userAccounts = await db.insert(accounts).values(defaultWallets).returning();
    }

    return {
      success: true,
      message: isNew
        ? "Account successfully created with default wallets."
        : "Welcome back to Fana!",
      isNewUser: isNew,
      user: currentUser,
      accounts: userAccounts,
    };
  } catch (error) {
    console.error("Failed to onboard user:", error);
    throw error;
  }
}
