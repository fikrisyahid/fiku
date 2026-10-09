"use server";

import { cookies } from "next/headers";
import { Theme, THEME_COOKIE_NAME } from "@/lib/theme/types";

export async function setThemeCookie(theme: Theme): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, theme, {
    path: "/",
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
