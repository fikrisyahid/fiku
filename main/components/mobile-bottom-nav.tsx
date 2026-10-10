"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, BarChart3, ShieldCheck, Settings } from "lucide-react";
import { Locale, getDictionary } from "@/lib/i18n/dictionary";

interface MobileBottomNavProps {
  locale?: Locale;
}

export function MobileBottomNav({ locale = "id" }: MobileBottomNavProps) {
  const pathname = usePathname();
  const dict = getDictionary(locale);

  // Hide on auth pages or root landing page if desired, but show on main app pages
  const isAuthPage = pathname === "/login" || pathname === "/";
  if (isAuthPage) return null;

  const navItems = [
    {
      label: dict.nav.transactions,
      href: "/transaction",
      icon: ArrowLeftRight,
      active: pathname.startsWith("/transaction"),
    },
    {
      label: dict.nav.summary,
      href: "/summary",
      icon: BarChart3,
      active: pathname.startsWith("/summary"),
    },
    {
      label: dict.nav.security,
      href: "/security",
      icon: ShieldCheck,
      active: pathname.startsWith("/security"),
    },
    {
      label: dict.nav.settings,
      href: "/settings",
      icon: Settings,
      active: pathname.startsWith("/settings"),
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] shadow-lg"
    >
      <div className="grid grid-cols-4 h-15 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors select-none ${
                item.active
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  item.active
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                    : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight truncate max-w-[70px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
