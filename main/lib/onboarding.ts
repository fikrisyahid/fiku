import { db } from "@/db";
import { users, accounts, userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

import { Locale, getDictionary, DEFAULT_LOCALE } from "@/lib/i18n/dictionary";
import { encryptWithPublicKey } from "@/lib/crypto";

export interface OnboardUserInput {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  initialCashBalance?: number;
  initialBankBalance?: number;
  initialEwalletBalance?: number;
  locale?: Locale;
  publicKey?: string | null;
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
    publicKey = null,
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
      const activePub = publicKey || currentUser.publicKey;
      const encryptVal = (val: string) => {
        return activePub ? encryptWithPublicKey(val, activePub) : val;
      };

      const defaultWallets = [
        {
          userId: currentUser.id,
          name: encryptVal(dict.defaultWallets.cash),
          type: "cash",
          balance: encryptVal("0"),
          isDefault: true,
        },
        {
          userId: currentUser.id,
          name: encryptVal(dict.defaultWallets.bank),
          type: "bank",
          balance: encryptVal("0"),
          isDefault: false,
        },
        {
          userId: currentUser.id,
          name: encryptVal(dict.defaultWallets.ewallet),
          type: "ewallet",
          balance: encryptVal("0"),
          isDefault: false,
        },
      ];

      userAccounts = await db.insert(accounts).values(defaultWallets).returning();
    }

    // Initialize userSettings if not already present
    const existingSettings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, currentUser.id),
    });

    if (!existingSettings) {
      await db.insert(userSettings).values({
        userId: currentUser.id,
        transactionCount: "0",
        currency: "IDR",
        emailNotifications: false,
      });
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
