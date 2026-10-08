"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { ArrowLeftRight, BarChart3, Wallet } from "lucide-react";

interface AppNavbarProps {
  user: {
    fullName: string;
    email: string;
    activeMode?: string;
  };
}

export function AppNavbar({ user }: AppNavbarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Transaksi",
      href: "/transaksi",
      icon: ArrowLeftRight,
      active: pathname.startsWith("/transaksi") || pathname === "/",
    },
    {
      label: "Ringkasan",
      href: "/ringkasan",
      icon: BarChart3,
      active: pathname.startsWith("/ringkasan"),
    },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 dark:bg-zinc-900/85 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/transaksi" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              F
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                Fana
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
                  Web
                </span>
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    item.active
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {user.fullName}
            </span>
            <span className="text-[11px] text-zinc-400 truncate max-w-[150px]">
              {user.email}
            </span>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
