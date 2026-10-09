"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { ArrowLeftRight, BarChart3, Menu, X, User, ShieldCheck } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Locale, getDictionary } from "@/lib/i18n/dictionary";

interface AppNavbarProps {
  user?: {
    fullName: string;
    email: string;
    activeMode?: string;
  } | null;
  locale?: Locale;
}

export function AppNavbar({ user, locale = "id" }: AppNavbarProps) {
  const pathname = usePathname();
  const dict = getDictionary(locale);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on path change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarOpen]);

  // Lock background scroll when sidebar is open on mobile
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

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
  ];

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-white/85 dark:bg-zinc-900/85 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-[1560px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
                F
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50">
                  Fiku
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 sm:gap-2">
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

          {/* Desktop Right User & Logout & Theme Switcher & Language Switcher */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeSwitcher />
            <LanguageSwitcher currentLocale={locale} />
            {user ? (
              <>
                <div className="flex flex-col text-right pl-1">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {user.fullName}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate max-w-[150px]">
                    {user.email}
                  </span>
                </div>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
              >
                {dict.nav.signInRegister}
              </Link>
            )}
          </div>

          {/* Mobile Sidebar Hamburger & Quick Switchers */}
          <div className="flex md:hidden items-center gap-1.5">
            <ThemeSwitcher compact />
            <LanguageSwitcher currentLocale={locale} compact />
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Buka menu navigasi"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ml-0.5"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Toggleable Sidebar (Drawer) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-y-0 right-0 w-[280px] max-w-[85vw] bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 flex flex-col justify-between animate-in slide-in-from-right duration-200"
          >
            {/* Top: Header & Close button */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    F
                  </div>
                  <span className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100">
                    Fiku
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  aria-label="Tutup menu"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-2">
                  {dict.nav.navigation}
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        item.active
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60 shadow-xs"
                          : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Theme & Preferences in Mobile Drawer */}
              <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2">
                  {dict.nav.themeToggle}
                </p>
                <div className="px-1">
                  <ThemeSwitcher fullWidth />
                </div>
              </div>
            </div>

            {/* Bottom: User Profile Info & Logout OR Sign In */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {user.fullName}
                      </span>
                      <span className="text-[11px] text-zinc-400 truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>

                  <div className="w-full pt-1">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-full h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center shadow-xs transition-all"
                >
                  {dict.nav.signInRegister}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
