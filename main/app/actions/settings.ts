"use server";

import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface UserSettingsData {
  id: string;
  userId: string;
  transactionCount: number;
  currency: string;
  emailNotifications: boolean;
}

import { SUPPORTED_CURRENCIES, SupportedCurrencyCode } from "@/lib/currency";
export type { SupportedCurrencyCode };

/**
 * Get or automatically create user settings
 */
export async function getUserSettings(userId: string): Promise<UserSettingsData> {
  let settings = await db.query.userSettings.findFirst({
    where: eq(userSettings.userId, userId),
  });

  if (!settings) {
    const [created] = await db
      .insert(userSettings)
      .values({
        userId,
        transactionCount: "0",
        currency: "IDR",
        emailNotifications: false,
      })
      .returning();
    settings = created;
  }

  return {
    id: settings.id,
    userId: settings.userId,
    transactionCount: parseInt(settings.transactionCount, 10) || 0,
    currency: settings.currency || "IDR",
    emailNotifications: settings.emailNotifications ?? false,
  };
}

/**
 * Update user currency preference
 */
export async function updateUserCurrency(userId: string, currency: string): Promise<
  | { success: true; currency: string }
  | { success: false; error: string; currency?: never }
> {
  const valid = SUPPORTED_CURRENCIES.some((c) => c.code === currency);
  if (!valid) {
    return { success: false, error: `Currency ${currency} tidak didukung.` };
  }

  await getUserSettings(userId); // ensure row exists

  const [updated] = await db
    .update(userSettings)
    .set({
      currency,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId))
    .returning();

  return {
    success: true,
    currency: updated.currency,
  };
}

/**
 * Increment transaction count cache (+1, +N)
 */
export async function incrementUserTransactionCount(userId: string, delta: number = 1) {
  const current = await getUserSettings(userId);
  const nextCount = Math.max(0, current.transactionCount + delta);

  await db
    .update(userSettings)
    .set({
      transactionCount: nextCount.toString(),
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));

  return nextCount;
}

/**
 * Decrement transaction count cache (-1, -N)
 */
export async function decrementUserTransactionCount(userId: string, delta: number = 1) {
  return incrementUserTransactionCount(userId, -delta);
}
