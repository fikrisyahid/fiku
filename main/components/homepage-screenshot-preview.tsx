"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/lib/theme/context";
import { useI18n } from "@/lib/i18n/context";
import {
  TableProperties,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Calendar,
  Layers,
  ExternalLink,
} from "lucide-react";

interface LiveTransaction {
  id: string;
  transactionDate: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  wallet: string;
  category: string;
  note: string;
}

// Generate relative dates from today: today, yesterday, 2 days ago
function getRelativeDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split("T")[0];
}

function getInitialDemoTransactions(locale: string): LiveTransaction[] {
  const today = getRelativeDateStr(0);
  const yesterday = getRelativeDateStr(1);
  const twoDaysAgo = getRelativeDateStr(2);

  const isEn = locale === "en";

  return [
    {
      id: "demo-1",
      transactionDate: today,
      type: "expense",
      amount: 45000,
      wallet: "BCA",
      category: isEn ? "Food & Drinks" : "Makan & Minum",
      note: isEn ? "Grilled chicken dinner" : "Makan malam ayam bakar",
    },
    {
      id: "demo-2",
      transactionDate: today,
      type: "expense",
      amount: 18000,
      wallet: "GoPay",
      category: isEn ? "Transportation" : "Transportasi",
      note: isEn ? "Online ride to train station" : "Ojek online ke stasiun",
    },
    {
      id: "demo-3",
      transactionDate: yesterday,
      type: "expense",
      amount: 85000,
      wallet: "BCA",
      category: isEn ? "Groceries" : "Belanja",
      note: isEn ? "Supermarket veggies & fruits" : "Belanja sayur & buah supermarket",
    },
    {
      id: "demo-4",
      transactionDate: yesterday,
      type: "income",
      amount: 7500000,
      wallet: "Mandiri",
      category: isEn ? "Salary" : "Gaji",
      note: isEn ? "Monthly salary payout" : "Gaji bulanan",
    },
    {
      id: "demo-5",
      transactionDate: twoDaysAgo,
      type: "transfer",
      amount: 500000,
      wallet: "Mandiri ➔ BCA",
      category: isEn ? "Transfer" : "Transfer",
      note: isEn ? "Top up weekly living expense" : "Top up kebutuhan mingguan",
    },
    {
      id: "demo-6",
      transactionDate: twoDaysAgo,
      type: "expense",
      amount: 150000,
      wallet: "Cash",
      category: isEn ? "Bills" : "Tagihan",
      note: isEn ? "WiFi internet bill" : "Tagihan internet bulanan",
    },
  ];
}

export function HomepageScreenshotPreview() {
  const { resolvedTheme } = useTheme();
  const { dict, locale } = useI18n();

  const [activeTab, setActiveTab] = useState<"transactions" | "summary">("transactions");
  const [transactions, setTransactions] = useState<LiveTransaction[]>(() =>
    getInitialDemoTransactions(locale)
  );

  // Sync state (simulates real cloud debounce sync)
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving">("synced");

  // Smart Input text
  const [smartInputText, setSmartInputText] = useState("");
  const [smartFeedback, setSmartFeedback] = useState<string | null>(null);

  const isDark = resolvedTheme === "dark";

  // Re-initialize demo data if locale changes
  useEffect(() => {
    setTransactions(getInitialDemoTransactions(locale));
  }, [locale]);

  // Trigger sync animation whenever transactions change
  function triggerSync() {
    setSyncStatus("saving");
    const t = setTimeout(() => {
      setSyncStatus("synced");
    }, 450);
    return () => clearTimeout(t);
  }

  // Handle cell edit
  function handleCellChange(id: string, field: keyof LiveTransaction, val: any) {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
    );
    triggerSync();
  }

  // Handle Add Row
  function handleAddRow() {
    const today = getRelativeDateStr(0);
    const newTx: LiveTransaction = {
      id: `demo-${Date.now()}`,
      transactionDate: today,
      type: "expense",
      amount: 25000,
      wallet: "Cash",
      category: locale === "en" ? "Food & Drinks" : "Makan & Minum",
      note: locale === "en" ? "Coffee & snack" : "Kopi & camilan",
    };
    setTransactions((prev) => [newTx, ...prev]);
    triggerSync();
  }

  // Handle Delete Row
  function handleDeleteRow(id: string) {
    setTransactions((prev) => prev.filter((item) => item.id !== id));
    triggerSync();
  }

  // Reset demo data
  function handleReset() {
    setTransactions(getInitialDemoTransactions(locale));
    triggerSync();
  }

  // Handle Smart Input submission
  function handleSmartInputSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!smartInputText.trim()) return;

    const raw = smartInputText.trim().toLowerCase();
    const today = getRelativeDateStr(0);

    // Parse amount (support 25k, 25rb, 100000, 1.5jt, 1.5m)
    let amount = 25000;
    let type: "expense" | "income" | "transfer" = "expense";

    if (raw.startsWith("+") || raw.includes("gaji") || raw.includes("bonus") || raw.includes("income") || raw.includes("salary")) {
      type = "income";
    } else if (raw.startsWith("tf") || raw.includes("transfer") || raw.includes("ke")) {
      type = "transfer";
    }

    // Match numbers
    const numMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|m|million)?/i);
    if (numMatch) {
      let num = parseFloat(numMatch[1].replace(",", "."));
      const unit = (numMatch[2] || "").toLowerCase();
      if (unit === "k" || unit === "rb" || unit === "ribu") {
        num *= 1000;
      } else if (unit === "jt" || unit === "juta" || unit === "m" || unit === "million") {
        num *= 1000000;
      }
      amount = Math.round(num);
    }

    // Wallets & Categories heuristics
    let wallet = "BCA";
    if (raw.includes("cash") || raw.includes("tunai")) wallet = "Cash";
    else if (raw.includes("gopay") || raw.includes("gojek")) wallet = "GoPay";
    else if (raw.includes("mandiri")) wallet = "Mandiri";
    else if (raw.includes("bca")) wallet = "BCA";

    let category = type === "income" ? (locale === "en" ? "Salary" : "Gaji") : (locale === "en" ? "Food & Drinks" : "Makan & Minum");
    if (raw.includes("makan") || raw.includes("ayam") || raw.includes("kopi") || raw.includes("food") || raw.includes("lunch")) {
      category = locale === "en" ? "Food & Drinks" : "Makan & Minum";
    } else if (raw.includes("ojek") || raw.includes("bensin") || raw.includes("transport") || raw.includes("ride")) {
      category = locale === "en" ? "Transportation" : "Transportasi";
    } else if (raw.includes("belanja") || raw.includes("sayur") || raw.includes("grocery")) {
      category = locale === "en" ? "Groceries" : "Belanja";
    } else if (raw.includes("wifi") || raw.includes("listrik") || raw.includes("bill")) {
      category = locale === "en" ? "Bills" : "Tagihan";
    }

    const note = smartInputText.trim();

    const created: LiveTransaction = {
      id: `demo-${Date.now()}`,
      transactionDate: today,
      type,
      amount,
      wallet,
      category,
      note,
    };

    setTransactions((prev) => [created, ...prev]);
    setSmartInputText("");
    setSmartFeedback(
      locale === "en"
        ? `Added: ${type.toUpperCase()} ${new Intl.NumberFormat("id-ID").format(amount)} (${category})`
        : `Ditambahkan: ${type === "expense" ? "Pengeluaran" : type === "income" ? "Pemasukan" : "Transfer"} Rp ${new Intl.NumberFormat("id-ID").format(amount)} (${category})`
    );
    triggerSync();

    setTimeout(() => {
      setSmartFeedback(null);
    }, 3500);
  }

  // Computed summary metrics
  const summary = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let expenseCount = 0;
    let incomeCount = 0;
    const catMap: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === "expense") {
        totalExpense += t.amount;
        expenseCount += 1;
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      } else if (t.type === "income") {
        totalIncome += t.amount;
        incomeCount += 1;
      }
    }

    const netCashflow = totalIncome - totalExpense;

    const catBreakdown = Object.entries(catMap)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalExpense,
      totalIncome,
      netCashflow,
      expenseCount,
      incomeCount,
      catBreakdown,
    };
  }, [transactions]);

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-6">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>{dict.landing.previewBadge}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.landing.previewTitle}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          {dict.landing.previewSub}
        </p>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="inline-flex p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "transactions"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <TableProperties className="w-4 h-4" />
            <span>{dict.landing.previewTabTransactions}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono">
              {transactions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "summary"
                ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{dict.landing.previewTabSummary}</span>
          </button>
        </div>

        {/* Sync Indicator & Reset Button */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 shadow-2xs">
            {syncStatus === "saving" ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>{dict.landing.previewSyncing}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-zinc-700 dark:text-zinc-300">{dict.landing.previewSynced}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleReset}
            title={dict.landing.previewResetBtn}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">{dict.landing.previewResetBtn}</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Window Frame */}
      <div className="relative rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden transition-all">
        {/* Window Chrome Header */}
        <div className="h-10 px-4 bg-zinc-100/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] px-3 py-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-800">
            <span>https://fiku.app/{activeTab === "transactions" ? "transaction" : "summary"}</span>
          </div>

          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            {isDark ? "Dark Theme" : "Light Theme"}
          </div>
        </div>

        {/* Sandbox Content Area */}
        <div className="p-4 sm:p-6 bg-zinc-50/70 dark:bg-zinc-950/80 space-y-5">
          {activeTab === "transactions" ? (
            <div className="space-y-4">
              {/* Interactive Smart Input Form */}
              <form
                onSubmit={handleSmartInputSubmit}
                className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col sm:flex-row items-center gap-2"
              >
                <div className="relative w-full flex-1 flex items-center">
                  <Sparkles className="w-4 h-4 text-emerald-600 absolute left-3 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    value={smartInputText}
                    onChange={(e) => setSmartInputText(e.target.value)}
                    placeholder={dict.landing.previewSmartHint}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-transparent rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Catat Instan</span>
                  </button>
                </div>
              </form>

              {smartFeedback && (
                <div className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{smartFeedback}</span>
                </div>
              )}

              {/* Action Strip: Add Row & Table Count */}
              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 font-bold text-xs text-zinc-700 dark:text-zinc-200 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{dict.landing.previewAddRowBtn}</span>
                </button>
                <span className="text-[11px] text-zinc-400">
                  {transactions.length} baris (editable live)
                </span>
              </div>

              {/* Editable Live Spreadsheet Table */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-zinc-100/80 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-28">{dict.common.date}</th>
                      <th className="py-2.5 px-3 w-24">{dict.common.type}</th>
                      <th className="py-2.5 px-3 w-32">{dict.common.amount}</th>
                      <th className="py-2.5 px-3 w-32">{dict.common.wallet}</th>
                      <th className="py-2.5 px-3 w-36">{dict.common.category}</th>
                      <th className="py-2.5 px-3">{dict.common.note}</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors group"
                      >
                        {/* Date Cell */}
                        <td className="p-2">
                          <input
                            type="date"
                            value={t.transactionDate}
                            onChange={(e) =>
                              handleCellChange(t.id, "transactionDate", e.target.value)
                            }
                            className="w-full bg-transparent text-[11px] font-mono text-zinc-600 dark:text-zinc-300 focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800 px-1.5 py-1 rounded"
                          />
                        </td>

                        {/* Type Cell */}
                        <td className="p-2">
                          <select
                            value={t.type}
                            onChange={(e) =>
                              handleCellChange(t.id, "type", e.target.value)
                            }
                            className={`w-full text-[11px] font-bold px-1.5 py-1 rounded focus:outline-none cursor-pointer ${
                              t.type === "expense"
                                ? "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300"
                                : t.type === "income"
                                ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
                                : "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            <option value="expense">{dict.txTypes.expense}</option>
                            <option value="income">{dict.txTypes.income}</option>
                            <option value="transfer">{dict.txTypes.transfer}</option>
                          </select>
                        </td>

                        {/* Amount Cell */}
                        <td className="p-2">
                          <input
                            type="number"
                            value={t.amount}
                            onChange={(e) =>
                              handleCellChange(
                                t.id,
                                "amount",
                                Math.max(0, parseInt(e.target.value) || 0)
                              )
                            }
                            className={`w-full font-mono font-bold text-xs px-1.5 py-1 rounded bg-transparent focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800 ${
                              t.type === "expense"
                                ? "text-rose-600 dark:text-rose-400"
                                : t.type === "income"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-blue-600 dark:text-blue-400"
                            }`}
                          />
                        </td>

                        {/* Wallet Cell */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={t.wallet}
                            onChange={(e) =>
                              handleCellChange(t.id, "wallet", e.target.value)
                            }
                            className="w-full text-xs text-zinc-700 dark:text-zinc-200 px-1.5 py-1 rounded bg-transparent focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800 font-medium"
                          />
                        </td>

                        {/* Category Cell */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={t.category}
                            onChange={(e) =>
                              handleCellChange(t.id, "category", e.target.value)
                            }
                            className="w-full text-xs text-zinc-600 dark:text-zinc-300 px-1.5 py-1 rounded bg-transparent focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800"
                          />
                        </td>

                        {/* Note Cell */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={t.note}
                            onChange={(e) =>
                              handleCellChange(t.id, "note", e.target.value)
                            }
                            className="w-full text-xs text-zinc-500 dark:text-zinc-400 px-1.5 py-1 rounded bg-transparent focus:outline-none focus:bg-zinc-100 dark:focus:bg-zinc-800 truncate"
                          />
                        </td>

                        {/* Delete Cell */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(t.id)}
                            title="Hapus baris"
                            className="p-1 rounded text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Realtime Financial Summary Tab */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{dict.ringkasan.expenseThisPeriod}</span>
                    <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                    {formatRupiah(summary.totalExpense)}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {summary.expenseCount} {locale === "en" ? "expenses" : "transaksi pengeluaran"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{dict.ringkasan.incomeThisPeriod}</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(summary.totalIncome)}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {summary.incomeCount} {locale === "en" ? "income records" : "pemasukan"}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{dict.ringkasan.netSavings}</span>
                    <PieChart className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div
                    className={`text-xl sm:text-2xl font-black font-mono ${
                      summary.netCashflow >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {summary.netCashflow >= 0 ? "+" : ""}
                    {formatRupiah(summary.netCashflow)}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold">
                    {summary.netCashflow >= 0
                      ? locale === "en"
                        ? "Net Surplus"
                        : "Surplus Positif"
                      : locale === "en"
                      ? "Net Deficit"
                      : "Defisit"}
                  </div>
                </div>
              </div>

              {/* Dynamic Categorical Breakdown based on current live transactions */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>{dict.ringkasan.categoryAllocationTitle}</span>
                  </h4>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {transactions.length} Total Data
                  </span>
                </div>

                {summary.catBreakdown.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">
                    Belum ada pengeluaran yang dicatat.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {summary.catBreakdown.map((cat, idx) => {
                      const colors = [
                        "bg-emerald-500",
                        "bg-blue-500",
                        "bg-amber-500",
                        "bg-purple-500",
                        "bg-rose-500",
                      ];
                      const color = colors[idx % colors.length];

                      return (
                        <div key={cat.name} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">
                              {cat.name}
                            </span>
                            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                              {formatRupiah(cat.amount)} ({cat.percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${color} rounded-full transition-all duration-300`}
                              style={{ width: `${Math.max(5, cat.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-4 py-3 bg-zinc-100/60 dark:bg-zinc-950/60 border-t border-zinc-200/80 dark:border-zinc-800 text-center text-[11px] text-zinc-500">
          {dict.landing.previewSandboxNotice}
        </div>
      </div>
    </section>
  );
}
