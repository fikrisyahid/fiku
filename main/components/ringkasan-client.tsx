"use client";

import { useState, useMemo } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RingkasanClientProps {
  transactions: any[];
  accounts: any[];
}

type PeriodMode = "harian" | "mingguan" | "bulanan" | "tahunan";

export function RingkasanClient({
  transactions,
  accounts,
}: RingkasanClientProps) {
  const [period, setPeriod] = useState<PeriodMode>("bulanan");
  const [offset, setOffset] = useState<number>(0); // 0 = current, -1 = previous, etc.

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Helper date calculations based on period and offset
  const { periodLabel, filteredTransactions } = useMemo(() => {
    const now = new Date();
    const targetDate = new Date();

    if (period === "harian") {
      targetDate.setDate(now.getDate() + offset);
      const targetStr = targetDate.toISOString().split("T")[0];
      const label = targetDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const filtered = transactions.filter((t) => t.transactionDate === targetStr);
      return { periodLabel: label, filteredTransactions: filtered };
    }

    if (period === "mingguan") {
      // Offset weeks
      targetDate.setDate(now.getDate() + offset * 7);
      // Get current week start (Monday) and end (Sunday)
      const day = targetDate.getDay();
      const diffToMonday = targetDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(targetDate.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monStr = monday.toISOString().split("T")[0];
      const sunStr = sunday.toISOString().split("T")[0];

      const label = `${monday.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      })} - ${sunday.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`;

      const filtered = transactions.filter(
        (t) => t.transactionDate >= monStr && t.transactionDate <= sunStr
      );
      return { periodLabel: label, filteredTransactions: filtered };
    }

    if (period === "bulanan") {
      targetDate.setMonth(now.getMonth() + offset);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const prefix = `${year}-${month}`;
      const label = targetDate.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      const filtered = transactions.filter((t) =>
        t.transactionDate.startsWith(prefix)
      );
      return { periodLabel: label, filteredTransactions: filtered };
    }

    // tahunan
    targetDate.setFullYear(now.getFullYear() + offset);
    const yearStr = `${targetDate.getFullYear()}`;
    const label = `Tahun ${yearStr}`;
    const filtered = transactions.filter((t) =>
      t.transactionDate.startsWith(yearStr)
    );
    return { periodLabel: label, filteredTransactions: filtered };
  }, [period, offset, transactions]);

  // Aggregate financial metrics
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpense;

  const totalSaldoAkumulasi = accounts.reduce(
    (sum, a) => sum + parseFloat(a.balance || "0"),
    0
  );

  // Group expenses by category
  const expensesByCategory = useMemo(() => {
    const map = new Map<string, { name: string; icon: string; total: number }>();
    for (const t of filteredTransactions) {
      if (t.type === "expense" && t.category) {
        const catId = t.category.id;
        const current = map.get(catId) || {
          name: t.category.name,
          icon: t.category.icon || "💸",
          total: 0,
        };
        current.total += parseFloat(t.amount || "0");
        map.set(catId, current);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Period Filter Selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-2 sm:p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/70 p-1 rounded-xl">
          {(["harian", "mingguan", "bulanan", "tahunan"] as PeriodMode[]).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setPeriod(mode);
                  setOffset(0);
                }}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  period === mode
                    ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {mode}
              </button>
            )
          )}
        </div>

        {/* Date Navigator Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            type="button"
            onClick={() => setOffset((prev) => prev - 1)}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 min-w-[140px] text-center">
            {periodLabel}
          </span>
          <button
            type="button"
            onClick={() => setOffset((prev) => prev + 1)}
            disabled={offset >= 0}
            className={`p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              offset >= 0 ? "opacity-30 cursor-not-allowed" : ""
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {offset !== 0 && (
            <button
              type="button"
              onClick={() => setOffset(0)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline ml-1"
            >
              Reset
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
              Total Saldo Semua Kantong
              <Wallet className="w-4 h-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-50">
              {formatRupiah(totalSaldoAkumulasi)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">Kekayaan tunai & tabungan</p>
          </CardContent>
        </Card>

        {/* Pemasukan Periode Ini */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
              Pemasukan ({period})
              <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600">
                <ArrowDownRight className="w-3.5 h-3.5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatRupiah(totalIncome)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Dari {filteredTransactions.filter((t) => t.type === "income").length} transaksi
            </p>
          </CardContent>
        </Card>

        {/* Pengeluaran Periode Ini */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
              Pengeluaran ({period})
              <div className="p-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatRupiah(totalExpense)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Dari {filteredTransactions.filter((t) => t.type === "expense").length} transaksi
            </p>
          </CardContent>
        </Card>

        {/* Arus Kas Bersih (Net) */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-medium text-zinc-500 flex items-center justify-between">
              Arus Kas Bersih (Net)
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
              {formatRupiah(netSavings)}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {netSavings >= 0 ? "Surplus (Hemat)" : "Defisit (Lebih besar belanja)"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Breakdown by Category & Wallets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pengeluaran per Kategori */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-600" />
              Alokasi Pengeluaran per Kategori
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3">
            {expensesByCategory.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Belum ada pengeluaran pada periode {periodLabel}.
              </div>
            ) : (
              expensesByCategory.map((cat) => {
                const percentage =
                  totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0;

                return (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <span>{cat.icon}</span> {cat.name}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(cat.total)} ({percentage}%)
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
              })
            )}
          </CardContent>
        </Card>

        {/* Status Dompet & Kantong */}
        <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900">
          <CardHeader className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Status Kantong & Rekening
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 divide-y divide-zinc-100 dark:divide-zinc-800">
            {accounts.map((acc) => (
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
                      {acc.type} {acc.isDefault ? "• Dompet Utama" : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {formatRupiah(parseFloat(acc.balance || "0"))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
