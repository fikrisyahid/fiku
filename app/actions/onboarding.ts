"use server";

import { onboardUser } from "@/lib/onboarding";
import { users, accounts } from "@/db/schema";

export type OnboardingResult = {
  success: boolean;
  message: string;
  user?: typeof users.$inferSelect;
  accounts?: (typeof accounts.$inferSelect)[];
  account?: typeof accounts.$inferSelect;
};

export async function submitWebOnboarding(formData: FormData): Promise<OnboardingResult> {
  const fullName = (formData.get("fullName") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const phone = (formData.get("phone") as string)?.trim() || null;

  if (!fullName || !email) {
    return { success: false, message: "Nama lengkap dan email wajib diisi!" };
  }

  try {
    const res = await onboardUser({
      fullName,
      email,
      phone,
    });

    const defaultAccount = res.accounts.find((a) => a.isDefault) || res.accounts[0];

    return {
      success: true,
      message: res.message,
      user: res.user,
      accounts: res.accounts,
      account: defaultAccount,
    };
  } catch (err: any) {
    console.error("Error onboarding web:", err);
    return {
      success: false,
      message: err?.message || "Gagal menyimpan data onboarding.",
    };
  }
}
