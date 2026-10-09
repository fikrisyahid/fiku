import { cookies } from "next/headers";
import { Theme, DEFAULT_THEME, THEME_COOKIE_NAME } from "./types";

export async function getServerTheme(): Promise<Theme> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(THEME_COOKIE_NAME)?.value;
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return DEFAULT_THEME;
}
