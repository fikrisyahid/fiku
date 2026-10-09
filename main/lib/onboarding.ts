import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";

import { Locale, getDictionary, DEFAULT_LOCALE } from "@/lib/i18n/dictionary";

export interface OnboardUserInput {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  initialCashBalance?: number;
  initialBankBalance?: number;
  initialEwalletBalance?: number;
  locale?: Locale;
}

export interface OnboardUserResult {
  success: boolean;
  message: string;
  isNewUser: boolean;
  user: typeof users.$inferSelect;
  accounts: (typeof accounts.$inferSelect)[];
}

/**
 * Shared onboarding logic for Web user creation and wallet setup.
 */
export async function onboardUser(input: OnboardUserInput): Promise<OnboardUserResult> {
  const {
    fullName,
    email: rawEmail,
    phone,
  } = input;

  const email = rawEmail?.trim().toLowerCase() || null;

  try {
    // 1. Check for existing user by email
    let existingUser: typeof users.$inferSelect | undefined;

    if (email) {
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

      if (fullName && (!existingUser.fullName || existingUser.fullName === "Sobat Fiku")) {
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
      if (!email) {
        throw new Error("Email wajib diisi untuk membuat akun pengguna.");
      }

      const [newUser] = await db
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          fullName: fullName || "Sobat Fiku",
          email,
          phone: phone || null,
        })
        .returning();

      currentUser = newUser;
    }

    // 2. Ensure starter default wallets exist (Cash, Bank, e-Wallet)
    let userAccounts = await db.query.accounts.findMany({
      where: eq(accounts.userId, currentUser.id),
    });

    const dict = getDictionary(input.locale || DEFAULT_LOCALE);

    if (userAccounts.length === 0) {
      const defaultWallets = [
        {
          userId: currentUser.id,
          name: dict.defaultWallets.cash,
          type: "cash",
          balance: "0",
          currency: "IDR",
          isDefault: true,
        },
        {
          userId: currentUser.id,
          name: dict.defaultWallets.bank,
          type: "bank",
          balance: "0",
          currency: "IDR",
          isDefault: false,
        },
        {
          userId: currentUser.id,
          name: dict.defaultWallets.ewallet,
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
        : "Welcome back to Fiku!",
      isNewUser: isNew,
      user: currentUser,
      accounts: userAccounts,
    };
  } catch (error) {
    console.error("Failed to onboard user:", error);
    throw error;
  }
}
