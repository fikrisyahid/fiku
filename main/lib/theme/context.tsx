"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useTransition,
  ReactNode,
} from "react";
import { Theme, DEFAULT_THEME } from "./types";
import { setThemeCookie } from "@/app/actions/theme";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  isPending: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  resolvedTheme: "light",
  setTheme: () => {},
  isPending: false,
});

export function ThemeProvider({
  children,
  initialTheme = DEFAULT_THEME,
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setThemeState(initialTheme);
  }, [initialTheme]);

  // Apply theme to document root
  useEffect(() => {
    function applyTheme() {
      const root = document.documentElement;
      let effective: "light" | "dark" = "light";

      if (theme === "system") {
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        effective = media.matches ? "dark" : "light";
      } else {
        effective = theme;
      }

      setResolvedTheme(effective);

      if (effective === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    applyTheme();

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme();
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    startTransition(async () => {
      await setThemeCookie(newTheme);
    });
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isPending }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
