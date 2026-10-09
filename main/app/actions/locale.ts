"use server";

import { cookies } from "next/headers";
import { Locale, LOCALE_COOKIE_NAME } from "@/lib/i18n/dictionary";

export async function setLocaleCookie(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
