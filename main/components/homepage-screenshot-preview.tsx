"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme/context";
import { useI18n } from "@/lib/i18n/context";
import {
  TableProperties,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  PieChart,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
  Wallet,
  Tag,
  PiggyBank,
  Check,
  X,
  Search,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { SmartInputHelpModal } from "@/components/smart-input-help-modal";
import { AlertModal, ModalAlertConfig } from "@/components/ui/alert-modal";

export interface DemoTransaction {
  id: string;
  transactionDate: string; // YYYY-MM-DD
  type: "income" | "expense" | "transfer";
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  amount: number;
  note: string;
  isNew?: boolean;
}

interface DemoAccount {
  id: string;
  name: string;
  type: "cash" | "bank" | "ewallet";
  balance: number;
  isDefault?: boolean;
}

interface DemoCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
}

function getRelativeDateStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().split("T")[0];
}

export function HomepageScreenshotPreview() {
  const { resolvedTheme } = useTheme();
  const { dict, locale } = useI18n();

  const [activeTab, setActiveTab] = useState<"transactions" | "summary">("transactions");
  const [activeQuickModal, setActiveQuickModal] = useState<"saldo" | "kantong" | "kategori" | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Base demo account balances
  const initialAccountBalances: Record<string, number> = useMemo(() => ({
    "acc-cash": 450000,
    "acc-bank": 12500000,
    "acc-ewallet": 850000,
  }), []);

  // Dynamic interactive account balances
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>(initialAccountBalances);

  // Accounts with live updated balances
  const demoAccounts = useMemo<DemoAccount[]>(() => [
    {
      id: "acc-cash",
      name: dict.defaultWallets.cash,
      type: "cash",
      balance: accountBalances["acc-cash"] ?? 450000,
      isDefault: true,
    },
    {
      id: "acc-bank",
      name: dict.defaultWallets.bank,
      type: "bank",
      balance: accountBalances["acc-bank"] ?? 12500000,
      isDefault: false,
    },
    {
      id: "acc-ewallet",
      name: dict.defaultWallets.ewallet,
      type: "ewallet",
      balance: accountBalances["acc-ewallet"] ?? 850000,
      isDefault: false,
    },
  ], [dict, accountBalances]);

  // Alert modal configuration for insufficient balance and errors
  const [alertModal, setAlertModal] = useState<ModalAlertConfig>({
    isOpen: false,
    title: "",
    message: "",
    variant: "warning",
  });

  // Default standard demo categories matching full app
  const demoCategories = useMemo<DemoCategory[]>(() => [
    // Expenses
    { id: "cat-food", name: dict.defaultCategories.food, type: "expense", icon: "🍜" },
    { id: "cat-transport", name: dict.defaultCategories.transport, type: "expense", icon: "🚗" },
    { id: "cat-groceries", name: dict.defaultCategories.groceries, type: "expense", icon: "🛒" },
    { id: "cat-bills", name: dict.defaultCategories.bills, type: "expense", icon: "💡" },
    { id: "cat-health", name: dict.defaultCategories.health, type: "expense", icon: "💊" },
    { id: "cat-entertainment", name: dict.defaultCategories.entertainment, type: "expense", icon: "🎬" },
    // Incomes
    { id: "cat-salary", name: dict.defaultCategories.salary, type: "income", icon: "💰" },
    { id: "cat-freelance", name: dict.defaultCategories.freelance, type: "income", icon: "💻" },
    { id: "cat-investment", name: dict.defaultCategories.investment, type: "income", icon: "📈" },
  ], [dict]);

  // Initial demo data with 2 days backward relative dates
  const initialData = useMemo<DemoTransaction[]>(() => {
    const today = getRelativeDateStr(0);
    const yesterday = getRelativeDateStr(1);
    const twoDaysAgo = getRelativeDateStr(2);

    return [
      {
        id: "tx-1",
        transactionDate: today,
        type: "expense",
        categoryId: "cat-food",
        accountId: "acc-bank",
        amount: 45000,
        note: locale === "en" ? "Grilled chicken dinner" : "Makan siang ayam bakar",
      },
      {
        id: "tx-2",
        transactionDate: today,
        type: "expense",
        categoryId: "cat-transport",
        accountId: "acc-ewallet",
        amount: 18000,
        note: locale === "en" ? "Online ride to train station" : "Ojek online ke kantor",
      },
      {
        id: "tx-3",
        transactionDate: yesterday,
        type: "expense",
        categoryId: "cat-groceries",
        accountId: "acc-bank",
        amount: 125000,
        note: locale === "en" ? "Supermarket veggies & fruits" : "Belanja sayur & buah supermarket",
      },
      {
        id: "tx-4",
        transactionDate: yesterday,
        type: "income",
        categoryId: "cat-salary",
        accountId: "acc-bank",
        amount: 8500000,
        note: locale === "en" ? "Monthly salary payout" : "Gaji bulanan",
      },
      {
        id: "tx-5",
        transactionDate: twoDaysAgo,
        type: "transfer",
        categoryId: "",
        accountId: "acc-bank",
        toAccountId: "acc-ewallet",
        amount: 500000,
        note: locale === "en" ? "Top up weekly living expense" : "Top up kebutuhan mingguan",
      },
      {
        id: "tx-6",
        transactionDate: twoDaysAgo,
        type: "expense",
        categoryId: "cat-bills",
        accountId: "acc-cash",
        amount: 150000,
        note: locale === "en" ? "Monthly internet & wifi" : "Tagihan internet bulanan",
      },
    ];
  }, [locale]);

  const [rows, setRows] = useState<DemoTransaction[]>(initialData);
  useEffect(() => {
    setRows(initialData);
  }, [initialData]);

  // Per-row saving/saved status tracking
  const [rowStatus, setRowStatus] = useState<Record<string, "saving" | "saved" | "error">>({});
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({});

  // Global sync status indicator
  const [globalSync, setGlobalSync] = useState<"synced" | "saving">("synced");

  // Selection & Search
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof DemoTransaction>("transactionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Smart input bar state
  const [smartInputText, setSmartInputText] = useState("");
  const [smartFeedback, setSmartFeedback] = useState<string | null>(null);

  const isDark = resolvedTheme === "dark";

  // Helper function to get account display name
  const getAccountName = (id: string) => {
    return demoAccounts.find((a) => a.id === id)?.name || id;
  };

  // Debounced row status simulator
  function markRowSaving(id: string) {
    setGlobalSync("saving");
    setRowStatus((prev) => ({ ...prev, [id]: "saving" }));

    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
    }

    timeoutRefs.current[id] = setTimeout(() => {
      setRowStatus((prev) => ({ ...prev, [id]: "saved" }));
      setGlobalSync("synced");

      // Reset 'saved' badge back to idle after 2.5s
      setTimeout(() => {
        setRowStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2500);
    }, 600);
  }

  // Handle cell edit in spreadsheet with balance validation and adjustment
  function handleCellChange(id: string, field: keyof DemoTransaction, value: any) {
    const currentRow = rows.find((r) => r.id === id);
    if (!currentRow) return;

    const proposedRow: DemoTransaction = { ...currentRow, [field]: value };

    // Format proposed row adjustments for transfer / type changes
    if (field === "type" && value === "transfer") {
      proposedRow.categoryId = "";
      if (!proposedRow.toAccountId || proposedRow.toAccountId === proposedRow.accountId) {
        proposedRow.toAccountId = demoAccounts.find((a) => a.id !== proposedRow.accountId)?.id || demoAccounts[0].id;
      }
    } else if (field === "type" && value !== "transfer") {
      const validCat = demoCategories.find((c) => c.type === value);
      proposedRow.categoryId = validCat ? validCat.id : demoCategories[0].id;
    }

    // 1. Calculate hypothetical account balances if currentRow is replaced with proposedRow
    const nextBalances = { ...accountBalances };

    // Revert current row effect
    if (currentRow.type === "expense") {
      nextBalances[currentRow.accountId] = (nextBalances[currentRow.accountId] ?? 0) + currentRow.amount;
    } else if (currentRow.type === "income") {
      nextBalances[currentRow.accountId] = (nextBalances[currentRow.accountId] ?? 0) - currentRow.amount;
    } else if (currentRow.type === "transfer" && currentRow.toAccountId) {
      nextBalances[currentRow.accountId] = (nextBalances[currentRow.accountId] ?? 0) + currentRow.amount;
      nextBalances[currentRow.toAccountId] = (nextBalances[currentRow.toAccountId] ?? 0) - currentRow.amount;
    }

    // Check if proposedRow is valid against reverted balance
    const sourceBal = nextBalances[proposedRow.accountId] ?? 0;

    if (proposedRow.type === "expense" && sourceBal < proposedRow.amount) {
      const fmtCurrent = formatCurrency(sourceBal);
      const fmtAmount = formatCurrency(proposedRow.amount);
      const accName = getAccountName(proposedRow.accountId);

      setAlertModal({
        isOpen: true,
        title: dict.transaksi.insufficientBalanceTitle,
        message:
          locale === "en"
            ? `Insufficient balance! Wallet "${accName}" currently has ${fmtCurrent}, not enough for expense of ${fmtAmount}.`
            : `Saldo tidak mencukupi! Saldo "${accName}" saat ini ${fmtCurrent}, tidak cukup untuk pengeluaran sebesar ${fmtAmount}.`,
        variant: "warning",
      });
      return;
    }

    if (proposedRow.type === "transfer") {
      if (proposedRow.toAccountId === proposedRow.accountId) {
        setAlertModal({
          isOpen: true,
          title: dict.transaksi.errSaveTitle,
          message: dict.transaksi.errTransferSameWallet,
          variant: "warning",
        });
        return;
      }

      if (sourceBal < proposedRow.amount) {
        const fmtFrom = formatCurrency(sourceBal);
        const fmtAmount = formatCurrency(proposedRow.amount);
        const accName = getAccountName(proposedRow.accountId);

        setAlertModal({
          isOpen: true,
          title: dict.transaksi.insufficientBalanceTitle,
          message:
            locale === "en"
              ? `Insufficient balance! Wallet "${accName}" currently has ${fmtFrom}, not enough for transfer of ${fmtAmount}.`
              : `Saldo tidak mencukupi! Saldo "${accName}" saat ini ${fmtFrom}, tidak cukup untuk transfer sebesar ${fmtAmount}.`,
          variant: "warning",
        });
        return;
      }
    }

    // Apply proposed effect to account balances
    if (proposedRow.type === "expense") {
      nextBalances[proposedRow.accountId] = sourceBal - proposedRow.amount;
    } else if (proposedRow.type === "income") {
      nextBalances[proposedRow.accountId] = sourceBal + proposedRow.amount;
    } else if (proposedRow.type === "transfer" && proposedRow.toAccountId) {
      nextBalances[proposedRow.accountId] = sourceBal - proposedRow.amount;
      nextBalances[proposedRow.toAccountId] = (nextBalances[proposedRow.toAccountId] ?? 0) + proposedRow.amount;
    }

    setAccountBalances(nextBalances);
    setRows((prev) => prev.map((r) => (r.id === id ? proposedRow : r)));
    markRowSaving(id);
  }

  // Add new row at top with balance validation
  function handleAddNewRow() {
    const today = getRelativeDateStr(0);
    const newId = `demo-${Date.now()}`;
    const defaultAccId = demoAccounts[0].id;
    const defaultAmount = 25000;
    const currentBal = accountBalances[defaultAccId] ?? 0;

    if (currentBal < defaultAmount) {
      const fmtCurrent = formatCurrency(currentBal);
      const fmtAmount = formatCurrency(defaultAmount);
      const accName = getAccountName(defaultAccId);

      setAlertModal({
        isOpen: true,
        title: dict.transaksi.insufficientBalanceTitle,
        message:
          locale === "en"
            ? `Insufficient balance! Wallet "${accName}" currently has ${fmtCurrent}, not enough for expense of ${fmtAmount}.`
            : `Saldo tidak mencukupi! Saldo "${accName}" saat ini ${fmtCurrent}, tidak cukup untuk pengeluaran sebesar ${fmtAmount}.`,
        variant: "warning",
      });
      return;
    }

    const newRow: DemoTransaction = {
      id: newId,
      transactionDate: today,
      type: "expense",
      categoryId: "cat-food",
      accountId: defaultAccId,
      amount: defaultAmount,
      note: locale === "en" ? "Coffee & snack" : "Kopi & camilan",
      isNew: true,
    };

    setAccountBalances((prev) => ({
      ...prev,
      [defaultAccId]: (prev[defaultAccId] ?? 0) - defaultAmount,
    }));
    setRows((prev) => [newRow, ...prev]);
    markRowSaving(newId);
  }

  // Delete row and revert its wallet mutation
  function handleDeleteRow(id: string) {
    const rowToDelete = rows.find((r) => r.id === id);
    if (rowToDelete) {
      setAccountBalances((prev) => {
        const next = { ...prev };
        if (rowToDelete.type === "expense") {
          next[rowToDelete.accountId] = (next[rowToDelete.accountId] ?? 0) + rowToDelete.amount;
        } else if (rowToDelete.type === "income") {
          next[rowToDelete.accountId] = (next[rowToDelete.accountId] ?? 0) - rowToDelete.amount;
        } else if (rowToDelete.type === "transfer" && rowToDelete.toAccountId) {
          next[rowToDelete.accountId] = (next[rowToDelete.accountId] ?? 0) + rowToDelete.amount;
          next[rowToDelete.toAccountId] = (next[rowToDelete.toAccountId] ?? 0) - rowToDelete.amount;
        }
        return next;
      });
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  // Batch delete selected with reverting all wallet mutations
  function handleBatchDelete() {
    const rowsToDelete = rows.filter((r) => selectedIds.has(r.id));
    setAccountBalances((prev) => {
      const next = { ...prev };
      for (const r of rowsToDelete) {
        if (r.type === "expense") {
          next[r.accountId] = (next[r.accountId] ?? 0) + r.amount;
        } else if (r.type === "income") {
          next[r.accountId] = (next[r.accountId] ?? 0) - r.amount;
        } else if (r.type === "transfer" && r.toAccountId) {
          next[r.accountId] = (next[r.accountId] ?? 0) + r.amount;
          next[r.toAccountId] = (next[r.toAccountId] ?? 0) - r.amount;
        }
      }
      return next;
    });

    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
  }

  // Reset to initial demo state
  function handleReset() {
    setRows(initialData);
    setAccountBalances(initialAccountBalances);
    setSelectedIds(new Set());
    setRowStatus({});
    setGlobalSync("synced");
  }

  // Smart Input submit handler
  function handleSmartInputSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!smartInputText.trim()) return;

    const raw = smartInputText.trim().toLowerCase();
    const today = getRelativeDateStr(0);

    let amount = 25000;
    let type: "expense" | "income" | "transfer" = "expense";

    if (
      raw.startsWith("+") ||
      raw.includes("gaji") ||
      raw.includes("bonus") ||
      raw.includes("income") ||
      raw.includes("salary") ||
      raw.includes("freelance") ||
      raw.includes("gift") ||
      raw.includes("angpao")
    ) {
      type = "income";
    } else if (
      raw.startsWith("tf") ||
      raw.includes("transfer") ||
      raw.includes("ke") ||
      raw.startsWith("move") ||
      raw.includes(" to ") ||
      raw.startsWith("tarik") ||
      raw.startsWith("withdraw")
    ) {
      type = "transfer";
    }

    // Number matching (25k, 25rb, 100000, 1.5jt, 1.5m, etc.)
    const numMatch = raw.match(/(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|m|million)?/i);
    if (numMatch) {
      let num = parseFloat(numMatch[1].replace(",", "."));
      const unit = (numMatch[2] || "").toLowerCase();
      if (unit === "k" || unit === "rb" || unit === "ribu") num *= 1000;
      else if (unit === "jt" || unit === "juta" || unit === "m" || unit === "million") num *= 1000000;
      amount = Math.round(num);
    }

    // Wallet matching
    let accountId = demoAccounts[0].id;
    let toAccountId: string | undefined = undefined;

    if (raw.includes("cash") || raw.includes("tunai") || raw.includes("wallet")) accountId = "acc-cash";
    else if (raw.includes("bank") || raw.includes("bca") || raw.includes("mandiri")) accountId = "acc-bank";
    else if (raw.includes("gopay") || raw.includes("ewallet") || raw.includes("ovo")) accountId = "acc-ewallet";

    if (type === "transfer") {
      toAccountId = accountId === "acc-bank" ? "acc-cash" : "acc-bank";
    }

    // Category matching
    let categoryId = type === "income" ? "cat-salary" : "cat-food";
    if (
      raw.includes("makan") ||
      raw.includes("ayam") ||
      raw.includes("kopi") ||
      raw.includes("coffee") ||
      raw.includes("food") ||
      raw.includes("lunch") ||
      raw.includes("dining")
    ) {
      categoryId = "cat-food";
    } else if (
      raw.includes("ojek") ||
      raw.includes("bensin") ||
      raw.includes("gas") ||
      raw.includes("fuel") ||
      raw.includes("transport") ||
      raw.includes("ride")
    ) {
      categoryId = "cat-transport";
    } else if (
      raw.includes("belanja") ||
      raw.includes("sayur") ||
      raw.includes("grocery") ||
      raw.includes("groceries") ||
      raw.includes("shopping")
    ) {
      categoryId = "cat-groceries";
    } else if (
      raw.includes("wifi") ||
      raw.includes("listrik") ||
      raw.includes("tagihan") ||
      raw.includes("bill") ||
      raw.includes("rent") ||
      raw.includes("kos") ||
      raw.includes("apartment")
    ) {
      categoryId = "cat-bills";
    } else if (raw.includes("freelance") || raw.includes("design") || raw.includes("gig")) {
      categoryId = "cat-freelance";
    } else if (raw.includes("invest") || raw.includes("saham") || raw.includes("stock")) {
      categoryId = "cat-investment";
    }

    // Balance check for expense & transfer
    const currentSourceBal = accountBalances[accountId] ?? 0;
    if (type === "expense" && currentSourceBal < amount) {
      const fmtCurrent = formatCurrency(currentSourceBal);
      const fmtAmount = formatCurrency(amount);
      const accName = getAccountName(accountId);

      setAlertModal({
        isOpen: true,
        title: dict.transaksi.insufficientBalanceTitle,
        message:
          locale === "en"
            ? `Insufficient balance! Wallet "${accName}" currently has ${fmtCurrent}, not enough for expense of ${fmtAmount}.`
            : `Saldo tidak mencukupi! Saldo "${accName}" saat ini ${fmtCurrent}, tidak cukup untuk pengeluaran sebesar ${fmtAmount}.`,
        variant: "warning",
      });
      return;
    }

    if (type === "transfer") {
      if (toAccountId === accountId) {
        setAlertModal({
          isOpen: true,
          title: dict.transaksi.errSaveTitle,
          message: dict.transaksi.errTransferSameWallet,
          variant: "warning",
        });
        return;
      }
      if (currentSourceBal < amount) {
        const fmtFrom = formatCurrency(currentSourceBal);
        const fmtAmount = formatCurrency(amount);
        const accName = getAccountName(accountId);

        setAlertModal({
          isOpen: true,
          title: dict.transaksi.insufficientBalanceTitle,
          message:
            locale === "en"
              ? `Insufficient balance! Wallet "${accName}" currently has ${fmtFrom}, not enough for transfer of ${fmtAmount}.`
              : `Saldo tidak mencukupi! Saldo "${accName}" saat ini ${fmtFrom}, tidak cukup untuk transfer sebesar ${fmtAmount}.`,
          variant: "warning",
        });
        return;
      }
    }

    const newId = `demo-${Date.now()}`;
    const newRow: DemoTransaction = {
      id: newId,
      transactionDate: today,
      type,
      categoryId: type === "transfer" ? "" : categoryId,
      accountId,
      toAccountId,
      amount,
      note: smartInputText.trim(),
    };

    setAccountBalances((prev) => {
      const next = { ...prev };
      if (type === "expense") {
        next[accountId] = (next[accountId] ?? 0) - amount;
      } else if (type === "income") {
        next[accountId] = (next[accountId] ?? 0) + amount;
      } else if (type === "transfer" && toAccountId) {
        next[accountId] = (next[accountId] ?? 0) - amount;
        next[toAccountId] = (next[toAccountId] ?? 0) + amount;
      }
      return next;
    });

    setRows((prev) => [newRow, ...prev]);
    setSmartInputText("");
    markRowSaving(newId);

    const catName = demoCategories.find((c) => c.id === categoryId)?.name || "";
    setSmartFeedback(
      locale === "en"
        ? `Added: ${type.toUpperCase()} Rp ${new Intl.NumberFormat("id-ID").format(amount)} (${catName})`
        : `Ditambahkan: ${type === "expense" ? "Pengeluaran" : type === "income" ? "Pemasukan" : "Transfer"} Rp ${new Intl.NumberFormat("id-ID").format(amount)} (${catName})`
    );

    setTimeout(() => {
      setSmartFeedback(null);
    }, 3500);
  }

  // Sort & Filter
  const filteredRows = useMemo(() => {
    let result = [...rows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.note.toLowerCase().includes(q) ||
          r.transactionDate.includes(q) ||
          r.amount.toString().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "amount") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      valA = String(valA || "");
      valB = String(valB || "");
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return result;
  }, [rows, searchQuery, sortField, sortOrder]);

  // Realtime Financial Summary Calculation
  const summary = useMemo(() => {
    let totalExpense = 0;
    let totalIncome = 0;
    let expenseCount = 0;
    let incomeCount = 0;
    const catMap: Record<string, { name: string; amount: number; icon: string }> = {};

    for (const r of rows) {
      if (r.type === "expense") {
        totalExpense += r.amount;
        expenseCount += 1;
        const cat = demoCategories.find((c) => c.id === r.categoryId);
        const name = cat ? cat.name : dict.common.category;
        const icon = cat ? cat.icon : "🏷️";
        if (!catMap[name]) {
          catMap[name] = { name, amount: 0, icon };
        }
        catMap[name].amount += r.amount;
      } else if (r.type === "income") {
        totalIncome += r.amount;
        incomeCount += 1;
      }
    }

    const netCashflow = totalIncome - totalExpense;

    const catBreakdown = Object.values(catMap)
      .map((item) => ({
        ...item,
        percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
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
  }, [rows, demoCategories, dict]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const totalSaldo = demoAccounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <section className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-[1560px] mx-auto w-full space-y-6">
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

      {/* Tabs Switcher: Transaksi vs Summary */}
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
              {rows.length}
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

        {/* Global Sync Indicator & Reset Button */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 shadow-2xs">
            {globalSync === "saving" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="text-amber-600 dark:text-amber-400 font-bold">{dict.landing.previewSyncing}</span>
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
            <span>{dict.landing.previewResetBtn}</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Frame Container */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden transition-all">
        {/* Window Chrome Header */}
        <div className="h-10 px-4 bg-zinc-100/80 dark:bg-zinc-950/80 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] px-3 py-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-300/40 dark:border-zinc-800">
            <span>https://fiku.my.id/{activeTab === "transactions" ? "transaction" : "summary"}</span>
          </div>

          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {isDark ? "Dark Theme" : "Light Theme"}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 bg-zinc-50/60 dark:bg-zinc-950/70">
          {activeTab === "transactions" ? (
            <div className="space-y-6">
              {/* 1. Quick Modals Button Strip (/saldo, /kantong, /kategori) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveQuickModal("saldo")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-xs font-semibold hover:bg-emerald-100 transition-all shadow-sm cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>{dict.quickModals.btnSaldo}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuickModal("kantong")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all shadow-sm cursor-pointer"
                >
                  <PiggyBank className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{dict.quickModals.btnKantong}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuickModal("kategori")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all shadow-sm cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{dict.quickModals.btnKategori}</span>
                </button>

                <div className="ml-auto text-[11px] text-zinc-400 font-mono hidden md:inline">
                  Total Saldo Demo: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSaldo)}</strong>
                </div>
              </div>

              {/* 2. Interactive Smart Input Bar */}
              <div className="space-y-2">
                <form
                  onSubmit={handleSmartInputSubmit}
                  className="relative flex items-center shadow-sm rounded-2xl group"
                >
                  <div className="absolute left-3.5 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400 z-10">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <input
                    type="text"
                    value={smartInputText}
                    onChange={(e) => setSmartInputText(e.target.value)}
                    placeholder={dict.transaksi.smartInputPlaceholder}
                    className="w-full h-12 pl-10 pr-44 sm:pr-48 rounded-2xl text-xs sm:text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium placeholder:text-zinc-400 placeholder:truncate outline-none transition-all shadow-xs"
                  />
                  <div className="absolute right-1.5 flex items-center gap-1.5 pl-6 bg-gradient-to-l from-white via-white dark:from-zinc-900 dark:via-zinc-900 to-transparent rounded-r-2xl">
                    <button
                      type="button"
                      onClick={() => setIsHelpOpen(true)}
                      title={dict.transaksi.smartInputGuideBtn}
                      className="h-9 px-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/60 transition-colors shadow-2xs"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span className="hidden xs:inline sm:inline">{dict.transaksi.smartInputGuideBtn}</span>
                    </button>
                    <Button
                      type="submit"
                      disabled={!smartInputText.trim()}
                      size="sm"
                      className="h-9 px-3.5 sm:px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                    >
                      {dict.transaksi.smartInputSubmitBtn}
                    </Button>
                  </div>
                </form>

                {smartFeedback && (
                  <div className="text-xs px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{smartFeedback}</span>
                  </div>
                )}
              </div>

              {/* 3. Toolbar: Search, Batch Delete, Add Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={dict.transaksi.searchPlaceholder}
                    className="w-full h-10 pl-9 pr-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  {selectedIds.size > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleBatchDelete}
                      className="w-full sm:w-auto h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      {dict.transaksi.btnDeleteSelected(selectedIds.size)}
                    </Button>
                  )}

                  <Button
                    type="button"
                    onClick={handleAddNewRow}
                    size="sm"
                    className="w-full sm:w-auto h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    {dict.transaksi.btnNewRow}
                  </Button>
                </div>
              </div>

              {/* 4. Full-Featured Spreadsheet Table */}
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 font-semibold select-none whitespace-nowrap">
                      <th className="p-3 w-12 text-center whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.id))}
                          onChange={() => {
                            if (filteredRows.every((r) => selectedIds.has(r.id))) {
                              setSelectedIds(new Set());
                            } else {
                              setSelectedIds(new Set(filteredRows.map((r) => r.id)));
                            }
                          }}
                          className="w-4 h-4 rounded-md border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                        />
                      </th>
                      <th className="p-3 w-36 whitespace-nowrap">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={() => {
                          setSortField("transactionDate");
                          setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                        }}>
                          <span>{dict.transaksi.colDate}</span>
                          <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                        </div>
                      </th>
                      <th className="p-3 w-32 whitespace-nowrap">{dict.transaksi.colType}</th>
                      <th className="p-3 w-52 whitespace-nowrap">{dict.transaksi.colCategory}</th>
                      <th className="p-3 w-52 whitespace-nowrap">{dict.transaksi.colWallet}</th>
                      <th className="p-3 w-36 whitespace-nowrap">{dict.transaksi.colAmount()}</th>
                      <th className="p-3 min-w-[200px] whitespace-nowrap">{dict.transaksi.colNote}</th>
                      <th className="p-3 w-28 text-center whitespace-nowrap">{dict.transaksi.colActions}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredRows.map((row, index) => {
                      const status = rowStatus[row.id];
                      const isSaving = status === "saving";
                      const isSaved = status === "saved";
                      const isSelected = selectedIds.has(row.id);

                      return (
                        <tr
                          key={row.id}
                          className={`transition-colors whitespace-nowrap ${
                            isSelected
                              ? "bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12]"
                              : row.isNew
                              ? "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]"
                              : "hover:bg-zinc-500/[0.03]"
                          }`}
                        >
                          {/* Checkbox & Index */}
                          <td className="p-2.5 text-center text-[11px] text-zinc-400 font-mono">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(row.id)) next.delete(row.id);
                                    else next.add(row.id);
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 rounded-md border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                              />
                              <span className="text-[10px] text-zinc-400 select-none hidden sm:inline-block w-4 text-left">
                                {index + 1}
                              </span>
                            </div>
                          </td>

                          {/* Tanggal */}
                          <td className="p-2">
                            <div className="relative flex items-center">
                              <input
                                type="date"
                                disabled={isSaving}
                                value={row.transactionDate}
                                onChange={(e) => handleCellChange(row.id, "transactionDate", e.target.value)}
                                className={`w-full h-8 px-2.5 rounded-lg bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 outline-hidden transition-all shadow-2xs ${
                                  isSaving ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              />
                            </div>
                          </td>

                          {/* Tipe with CustomSelect */}
                          <td className="p-2">
                            <CustomSelect
                              disabled={isSaving}
                              value={row.type}
                              onChange={(val) => handleCellChange(row.id, "type", val as any)}
                              options={[
                                {
                                  value: "expense",
                                  label: dict.txTypes.expense,
                                  badge: "out",
                                  badgeClassName: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300",
                                },
                                {
                                  value: "income",
                                  label: dict.txTypes.income,
                                  badge: "in",
                                  badgeClassName: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
                                },
                                {
                                  value: "transfer",
                                  label: dict.txTypes.transfer,
                                  badge: "tf",
                                  badgeClassName: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
                                },
                              ]}
                              triggerClassName={`h-8 font-semibold ${
                                row.type === "income"
                                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30"
                                  : row.type === "expense"
                                  ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30"
                                  : "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                              } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                            />
                          </td>

                          {/* Kategori with CustomSelect */}
                          <td className="p-2">
                            {row.type === "transfer" ? (
                              <div className="text-[11px] text-zinc-400 italic px-2">
                                {dict.transaksi.internalTransfer}
                              </div>
                            ) : (
                              <CustomSelect
                                disabled={isSaving}
                                value={row.categoryId}
                                onChange={(val) => handleCellChange(row.id, "categoryId", val)}
                                options={demoCategories
                                  .filter((c) => c.type === row.type)
                                  .map((c) => ({
                                    value: c.id,
                                    label: c.name,
                                    icon: c.icon,
                                  }))}
                                triggerClassName={`h-8 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                              />
                            )}
                          </td>

                          {/* Kantong with CustomSelect */}
                          <td className="p-2">
                            {row.type === "transfer" ? (
                              <div className="flex items-center gap-1">
                                <CustomSelect
                                  disabled={isSaving}
                                  value={row.accountId}
                                  onChange={(val) => handleCellChange(row.id, "accountId", val)}
                                  options={demoAccounts.map((a) => ({
                                    value: a.id,
                                    label: a.name,
                                    icon: a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱",
                                  }))}
                                  triggerClassName={`h-8 border-zinc-200 dark:border-zinc-700 ${
                                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                />
                                <span className="text-[10px] text-zinc-400">➔</span>
                                <CustomSelect
                                  disabled={isSaving}
                                  value={row.toAccountId || demoAccounts[1].id}
                                  onChange={(val) => handleCellChange(row.id, "toAccountId", val)}
                                  options={demoAccounts.map((a) => ({
                                    value: a.id,
                                    label: a.name,
                                    icon: a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱",
                                  }))}
                                  triggerClassName={`h-8 border-zinc-200 dark:border-zinc-700 ${
                                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                                  }`}
                                />
                              </div>
                            ) : (
                              <CustomSelect
                                disabled={isSaving}
                                value={row.accountId}
                                onChange={(val) => handleCellChange(row.id, "accountId", val)}
                                options={demoAccounts.map((a) => ({
                                  value: a.id,
                                  label: a.name,
                                  icon: a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱",
                                  badge: formatCurrency(a.balance),
                                  badgeClassName: "font-mono font-normal text-zinc-500",
                                }))}
                                triggerClassName={`h-8 ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                              />
                            )}
                          </td>

                          {/* Nominal */}
                          <td className="p-2">
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-xs font-semibold text-zinc-400 select-none pointer-events-none">
                                Rp
                              </span>
                              <input
                                type="text"
                                inputMode="numeric"
                                disabled={isSaving}
                                value={row.amount ? row.amount.toLocaleString(locale === "en" ? "en-US" : "id-ID") : ""}
                                onChange={(e) => {
                                  const rawDigits = e.target.value.replace(/\D/g, "");
                                  const numericVal = rawDigits ? parseInt(rawDigits, 10) : 0;
                                  handleCellChange(row.id, "amount", numericVal);
                                }}
                                placeholder="0"
                                className={`w-full h-8 pl-8 pr-2 rounded-lg bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs font-mono font-bold outline-hidden ${
                                  isSaving ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              />
                            </div>
                          </td>

                          {/* Keterangan */}
                          <td className="p-2">
                            <input
                              type="text"
                              disabled={isSaving}
                              value={row.note}
                              onChange={(e) => handleCellChange(row.id, "note", e.target.value)}
                              placeholder={dict.transaksi.notePlaceholder}
                              className={`w-full h-8 px-2 rounded-lg bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs outline-hidden ${
                                isSaving ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            />
                          </td>

                          {/* Status Per-Row & Actions */}
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isSaving && (
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 bg-amber-50/50 dark:bg-amber-950/20" title={dict.transaksi.statusSaving}>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                </div>
                              )}
                              {isSaved && (
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20" title={dict.transaksi.statusSaved}>
                                  <CheckCircle2 className="w-4 h-4" />
                                </div>
                              )}

                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleDeleteRow(row.id)}
                                title={dict.transaksi.tooltipDelete}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all ${
                                  isSaving ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Realtime Financial Summary Tab */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{dict.ringkasan.expenseThisPeriod}</span>
                    <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400">
                    {formatCurrency(summary.totalExpense)}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {summary.expenseCount} {locale === "en" ? "expenses recorded" : "transaksi pengeluaran"}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{dict.ringkasan.incomeThisPeriod}</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.totalIncome)}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {summary.incomeCount} {locale === "en" ? "incomes recorded" : "pemasukan"}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{dict.ringkasan.netSavings}</span>
                    <PieChart className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      summary.netCashflow >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {summary.netCashflow >= 0 ? "+" : ""}
                    {formatCurrency(summary.netCashflow)}
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
              <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600" />
                    <span>{dict.ringkasan.categoryAllocationTitle}</span>
                  </h4>
                  <span className="text-xs font-mono text-zinc-400">
                    {rows.length} {locale === "en" ? "Transactions" : "Total Transaksi"}
                  </span>
                </div>

                {summary.catBreakdown.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-6">
                    Belum ada pengeluaran yang dicatat.
                  </p>
                ) : (
                  <div className="space-y-3.5">
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
                        <div key={cat.name} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 truncate max-w-[240px]">
                              <span>{cat.icon}</span>
                              <span>{cat.name}</span>
                            </span>
                            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                              {formatCurrency(cat.amount)} ({cat.percentage}%)
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
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

      {/* Quick Modal Popups Simulation (Saldo / Kantong / Kategori) */}
      {activeQuickModal && (
        <div
          onClick={() => setActiveQuickModal(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                {activeQuickModal === "saldo" && <Wallet className="w-5 h-5 text-emerald-600" />}
                {activeQuickModal === "kantong" && <PiggyBank className="w-5 h-5 text-blue-500" />}
                {activeQuickModal === "kategori" && <Tag className="w-5 h-5 text-amber-500" />}
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {activeQuickModal === "saldo" && dict.quickModals.titleSaldo}
                  {activeQuickModal === "kantong" && dict.quickModals.titleKantong}
                  {activeQuickModal === "kategori" && dict.quickModals.titleKategori}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQuickModal(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {activeQuickModal === "saldo" && (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <div className="text-xs text-zinc-500">{dict.quickModals.totalWealth}</div>
                  <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalSaldo)}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {demoAccounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱"}</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">{a.name}</span>
                        {a.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                            {dict.quickModals.defaultBadge}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(a.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeQuickModal === "kantong" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  {dict.quickModals.activeWallets(demoAccounts.length)}
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {demoAccounts.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱"}</span>
                        <div>
                          <div className="font-bold text-zinc-800 dark:text-zinc-200">{a.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono uppercase">{a.type}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(a.balance)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeQuickModal === "kategori" && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-500">
                  Daftar kategori bawaan resmi di Fiku:
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {demoCategories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 text-xs"
                    >
                      <span>{c.icon}</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {c.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={() => setActiveQuickModal(null)}
              className="w-full h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs mt-2"
            >
              {dict.common.close}
            </Button>
          </div>
        </div>
      )}

      {/* Smart Input Help / Guide Modal */}
      <SmartInputHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onSelectExample={(example) => {
          setSmartInputText(example);
          setIsHelpOpen(false);
        }}
      />

      {/* Alert Modal for insufficient balance or errors */}
      <AlertModal
        config={alertModal}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </section>
  );
}
