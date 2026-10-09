"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/lib/theme/context";
import { useI18n } from "@/lib/i18n/context";
import {
  TableProperties,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Wallet,
  PieChart,
} from "lucide-react";

export function HomepageScreenshotPreview() {
  const { resolvedTheme } = useTheme();
  const { dict, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<"transactions" | "summary">("transactions");

  // Track image load errors to gracefully fallback to vector mockups
  const [loadError, setLoadError] = useState<Record<string, boolean>>({});

  const isDark = resolvedTheme === "dark";

  // Light / dark specific image paths
  // Primary format: .webp, fallback: .png / .jpg
  const imageSources: Record<string, { light: string; dark: string; alt: string }> = {
    transactions: {
      light: "/screenshots/screenshot-transactions-light.png",
      dark: "/screenshots/screenshot-transactions-dark.png",
      alt: "Fiku Transactions Sheet Preview",
    },
    summary: {
      light: "/screenshots/screenshot-summary-light.png",
      dark: "/screenshots/screenshot-summary-dark.png",
      alt: "Fiku Financial Summary Preview",
    },
  };

  const currentConfig = imageSources[activeTab];
  const imageSrc = isDark ? currentConfig.dark : currentConfig.light;
  const hasError = !!loadError[imageSrc];

  return (
    <section className="py-12 px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>UI Showcase</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.landing.previewTitle}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          {dict.landing.previewSub}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "transactions"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>{dict.landing.previewTabTransactions}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "summary"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{dict.landing.previewTabSummary}</span>
          </button>
        </div>
      </div>

      {/* Preview Container / Window Frame */}
      <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden transition-all">
        {/* Window Chrome Header */}
        <div className="h-10 px-4 bg-zinc-100/70 dark:bg-zinc-950/60 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block"></span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] px-3 py-0.5 rounded-lg bg-zinc-200/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-300/40 dark:border-zinc-800">
            <span>https://fiku.app/{activeTab === "transactions" ? "transaction" : "summary"}</span>
          </div>

          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
            {isDark ? "Dark Theme" : "Light Theme"}
          </div>
        </div>

        {/* Real Screenshot or Fallback Placeholder */}
        {!hasError ? (
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-zinc-50 dark:bg-zinc-950">
            <Image
              src={imageSrc}
              alt={currentConfig.alt}
              fill
              className="object-cover object-top"
              onError={() => {
                setLoadError((prev) => ({ ...prev, [imageSrc]: true }));
              }}
              unoptimized
            />
          </div>
        ) : (
          /* High-Fidelity Themed Interactive Placeholder */
          <div className="p-4 sm:p-8 bg-zinc-50 dark:bg-zinc-950 space-y-6">
            {activeTab === "transactions" ? (
              <TransactionsPlaceholderView isDark={isDark} locale={locale} dict={dict} />
            ) : (
              <SummaryPlaceholderView isDark={isDark} locale={locale} dict={dict} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * High-fidelity placeholder for the Transactions table
 */
function TransactionsPlaceholderView({
  isDark,
  locale,
  dict,
}: {
  isDark: boolean;
  locale: string;
  dict: any;
}) {
  const rows = [
    {
      date: "09 Okt 2026",
      type: "out",
      typeLabel: dict.txTypes.expense,
      amount: "Rp 35.000",
      wallet: "BCA",
      category: locale === "en" ? "Food & Drinks" : "Makan & Minum",
      note: locale === "en" ? "Lunch ayam bakar" : "Makan siang ayam geprek",
    },
    {
      date: "09 Okt 2026",
      type: "out",
      typeLabel: dict.txTypes.expense,
      amount: "Rp 15.000",
      wallet: "GoPay",
      category: locale === "en" ? "Transportation" : "Transportasi",
      note: locale === "en" ? "Online bike" : "Ojek online ke kantor",
    },
    {
      date: "08 Okt 2026",
      type: "in",
      typeLabel: dict.txTypes.income,
      amount: "Rp 8.500.000",
      wallet: "Mandiri",
      category: locale === "en" ? "Salary" : "Gaji",
      note: locale === "en" ? "Monthly salary" : "Gaji bulanan",
    },
    {
      date: "08 Okt 2026",
      type: "tf",
      typeLabel: dict.txTypes.transfer,
      amount: "Rp 500.000",
      wallet: "Mandiri ➔ BCA",
      category: dict.txTypes.transfer,
      note: locale === "en" ? "Wallet top up" : "Top up kebutuhan mingguan",
    },
  ];

  return (
    <div className="space-y-4 font-sans select-none">
      {/* Top Smart Input bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-zinc-400 font-mono">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{locale === "en" ? '-45k dinner cash' : '-45k makan malam cash'}</span>
        </div>
        <span className="text-[10px] bg-emerald-600 text-white font-bold px-3 py-1 rounded-xl shadow-xs">
          Smart Input
        </span>
      </div>

      {/* Grid Table Mockup */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        <div className="grid grid-cols-6 gap-2 px-4 py-2.5 bg-zinc-100/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
          <span>{dict.common.date}</span>
          <span>{dict.common.type}</span>
          <span>{dict.common.amount}</span>
          <span>{dict.common.wallet}</span>
          <span>{dict.common.category}</span>
          <span>{dict.common.note}</span>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
          {rows.map((row, idx) => (
            <div key={idx} className="grid grid-cols-6 gap-2 px-4 py-3 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
              <span className="font-mono text-zinc-500 text-[11px]">{row.date}</span>
              <span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                    row.type === "out"
                      ? "bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300"
                      : row.type === "in"
                      ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
                      : "bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {row.typeLabel}
                </span>
              </span>
              <span className={`font-mono font-bold ${row.type === "out" ? "text-rose-600 dark:text-rose-400" : row.type === "in" ? "text-emerald-600 dark:text-emerald-400" : "text-blue-600 dark:text-blue-400"}`}>
                {row.amount}
              </span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{row.wallet}</span>
              <span className="text-zinc-600 dark:text-zinc-400 truncate">{row.category}</span>
              <span className="text-zinc-500 truncate text-[11px]">{row.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * High-fidelity placeholder for the Financial Summary charts & metrics
 */
function SummaryPlaceholderView({
  isDark,
  locale,
  dict,
}: {
  isDark: boolean;
  locale: string;
  dict: any;
}) {
  return (
    <div className="space-y-4 font-sans select-none">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{dict.ringkasan.totalExpense}</span>
            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            Rp 4.120.000
          </div>
          <div className="text-[10px] text-zinc-400">32 {locale === "en" ? "transactions" : "transaksi"}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{dict.ringkasan.totalIncome}</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            Rp 8.500.000
          </div>
          <div className="text-[10px] text-zinc-400">1 {locale === "en" ? "income source" : "pemasukan"}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{dict.ringkasan.netCashFlow}</span>
            <PieChart className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            +Rp 4.380.000
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold">{locale === "en" ? "+51.5% net surplus" : "+51.5% surplus positif"}</div>
        </div>
      </div>

      {/* Simulated Visual Breakdown Charts */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {dict.ringkasan.chartExpenseByCategory}
          </h4>
          <span className="text-[11px] font-mono text-zinc-400">Okt 2026</span>
        </div>

        {/* Categorical progress bars */}
        <div className="space-y-2 pt-1 text-xs">
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">🍜 {dict.defaultCategories.food}</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">Rp 1.850.000 (45%)</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: "45%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">🚗 {dict.defaultCategories.transport}</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">Rp 950.000 (23%)</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: "23%" }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-zinc-600 dark:text-zinc-400">💡 {dict.defaultCategories.bills}</span>
              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">Rp 720.000 (17%)</span>
            </div>
            <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "17%" }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
