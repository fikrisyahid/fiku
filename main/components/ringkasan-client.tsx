"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialChart } from "@/components/financial-chart";

import { useI18n } from "@/lib/i18n/context";
import { formatCurrencyValue } from "@/lib/currency";
import { getCategoryIcon } from "@/lib/category-icons";
import { PeriodMode } from "@/lib/date-summary";

interface RingkasanClientProps {
  transactions: any[];
  accounts: any[];
  currency?: string;
  initialPeriod?: PeriodMode;
  initialOffset?: number;
}

export function RingkasanClient({
  transactions,
  accounts,
  currency = "IDR",
  initialPeriod = "bulanan",
  initialOffset = 0,
}: RingkasanClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { dict, locale } = useI18n();

  const period = initialPeriod;
  const offset = initialOffset;

  const navigateTo = (newPeriod: PeriodMode, newOffset: number) => {
    startTransition(() => {
      const params = new URLSearchParams();
      if (newPeriod !== "bulanan") params.set("period", newPeriod);
      if (newOffset !== 0) params.set("offset", String(newOffset));
      const qs = params.toString();
      router.push(qs ? `/summary?${qs}` : "/summary");
    });
  };

  const formatCurrency = (amount: number) => {
    return formatCurrencyValue(amount, currency, locale);
  };

  const dateLocale = locale === "en" ? "en-US" : "id-ID";

  // Helper date calculations based on period and offset
  const periodLabel = useMemo(() => {
    const now = new Date();
    const targetDate = new Date();

    if (period === "harian") {
      targetDate.setDate(now.getDate() + offset);
      return targetDate.toLocaleDateString(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (period === "mingguan") {
      targetDate.setDate(now.getDate() + offset * 7);
      const day = targetDate.getDay();
      const diffToMonday = targetDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(targetDate.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return `${monday.toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "short",
      })} - ${sunday.toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;
    }

    if (period === "bulanan") {
      targetDate.setMonth(now.getMonth() + offset);
      return targetDate.toLocaleDateString(dateLocale, {
        month: "long",
        year: "numeric",
      });
    }

    // tahunan
    targetDate.setFullYear(now.getFullYear() + offset);
    return `${dict.ringkasan.yearLabel} ${targetDate.getFullYear()}`;
  }, [period, offset, dateLocale, dict.ringkasan.yearLabel]);

  // Aggregate financial metrics (transactions already filtered server-side)
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  }, [transactions]);

  const netSavings = totalIncome - totalExpense;

  const totalSaldoAkumulasi = accounts.reduce(
    (sum, a) => sum + parseFloat(a.balance || "0"),
    0
  );

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; total: number }>();
    for (const t of transactions) {
      if (t.type === "expense" && t.category) {
        const catId = t.category.id;
        const current = map.get(catId) || {
          name: t.category.name,
          icon: getCategoryIcon(t.category),
          total: 0,
        };
        current.total += parseFloat(t.amount || "0");
        map.set(catId, current);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  const displayedCategories = showAllCategories
    ? expensesByCategory
    : expensesByCategory.slice(0, 5);

  const displayedAccounts = showAllAccounts
    ? accounts
    : accounts.slice(0, 4);

  return (
    <div className="relative space-y-6">
      {/* Gear Loading Overlay when changing period or offset */}
      {isPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[2px] transition-all animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-800 shadow-xl">
            <div className="relative flex items-center justify-center">
              <Settings className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <Settings className="w-4 h-4 text-emerald-500/70 absolute -top-1 -right-1 animate-[spin_1.5s_linear_infinite_reverse]" />
            </div>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {locale === "id" ? "Memuat ringkasan..." : "Loading summary..."}
            </span>
          </div>
        </div>
      )}

      {/* Period Filter Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2 sm:p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl">
          {(["harian", "mingguan", "bulanan", "tahunan"] as PeriodMode[]).map(
            (mode) => {
              const label =
                mode === "harian"
                  ? dict.ringkasan.tabDaily
                  : mode === "mingguan"
                  ? dict.ringkasan.tabWeekly
                  : mode === "bulanan"
                  ? dict.ringkasan.tabMonthly
                  : dict.ringkasan.tabYearly;

              return (
                <button
                  key={mode}
                  type="button"
                  disabled={isPending}
                  onClick={() => navigateTo(mode, 0)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                    period === mode
                      ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {label}
                </button>
              );
            }
          )}
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => navigateTo(period, offset - 1)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 min-w-[140px] text-center">
            {periodLabel}
          </span>
          <button
            type="button"
            disabled={offset >= 0 || isPending}
            onClick={() => navigateTo(period, offset + 1)}
            className={`p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              offset >= 0 ? "opacity-30 cursor-not-allowed" : ""
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {offset !== 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => navigateTo(period, 0)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline ml-1"
            >
              {dict.ringkasan.btnReset}
            </button>
          )}
        </div>
      </div>

      {/* Financial Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo Saat Ini */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
              {dict.ringkasan.totalBalanceAll}
              <Wallet className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {formatCurrency(totalSaldoAkumulasi)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">{dict.ringkasan.totalBalanceDesc}</p>
          </CardContent>
        </Card>

        {/* Pemasukan Periode Ini */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
              {dict.ringkasan.incomeThisPeriod}
              <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {dict.ringkasan.txCount(transactions.filter((t) => t.type === "income").length)}
            </p>
          </CardContent>
        </Card>

        {/* Pengeluaran Periode Ini */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
              {dict.ringkasan.expenseThisPeriod}
              <div className="p-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpense)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {dict.ringkasan.txCount(transactions.filter((t) => t.type === "expense").length)}
            </p>
          </CardContent>
        </Card>

        {/* Arus Kas Bersih (Net) */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
              {dict.ringkasan.netSavings}
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div
              className={`text-xl sm:text-2xl font-black ${
                netSavings >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatCurrency(netSavings)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {netSavings >= 0 ? dict.ringkasan.netSavingsSurplus : dict.ringkasan.netSavingsDeficit}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Chart Component */}
      <FinancialChart
        period={period}
        periodLabel={periodLabel}
        transactions={transactions}
        currency={currency}
      />

      {/* Detail Breakdown by Category & Wallets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pengeluaran per Kategori */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              {dict.ringkasan.categoryAllocationTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            {expensesByCategory.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                {dict.ringkasan.emptyCategoryExpenses}
              </div>
            ) : (
              <>
                {displayedCategories.map((cat) => {
                  const percentage =
                    totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0;

                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <span>{cat.icon}</span> {cat.name}
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(cat.total)} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {expensesByCategory.length > 5 && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
                    <button
                      type="button"
                      onClick={() => setShowAllCategories((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-1 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <span>
                        {showAllCategories
                          ? dict.ringkasan.viewLess
                          : dict.ringkasan.viewMore(expensesByCategory.length)}
                      </span>
                      {showAllCategories ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Status Dompet & Kantong */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              {dict.ringkasan.walletStatusTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {displayedAccounts.map((acc) => (
                <div key={acc.id} className="py-3 flex items-center justify-between text-xs first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">
                      {acc.type === "cash" ? "💵" : acc.type === "bank" ? "🏦" : "📱"}
                    </span>
                    <div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {acc.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                        {acc.type} {acc.isDefault ? `• ${dict.ringkasan.primaryWalletBadge}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(parseFloat(acc.balance || "0"))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {accounts.length > 4 && (
              <div className="pt-3 mt-1 border-t border-zinc-100 dark:border-zinc-800/80 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllAccounts((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors py-1 px-3 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <span>
                    {showAllAccounts
                      ? dict.ringkasan.viewLess
                      : dict.ringkasan.viewMore(accounts.length)}
                  </span>
                  {showAllAccounts ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
