"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
} from "lucide-react";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsBatch,
} from "@/app/actions/transactions";
import { transferBetweenAccounts } from "@/app/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { ExportImportModal } from "@/components/export-import-modal";
import { AlertModal, ModalAlertConfig } from "@/components/ui/alert-modal";
import { DatabaseInspectorModal } from "@/components/database-inspector-modal";
import { getLocalTodayDateString } from "@/lib/utils";

import { useRouter, useSearchParams } from "next/navigation";
import { formatCurrencyValue, getCurrencySymbol } from "@/lib/currency";

export interface TransactionRow {
  id: string;
  transactionDate: string; // YYYY-MM-DD
  type: "income" | "expense" | "transfer";
  categoryId: string;
  accountId: string;
  toAccountId?: string;
  amount: number;
  note: string;
  isNew?: boolean;
  createdAt?: string;
}

interface TransactionsSheetProps {
  userId: string;
  familyId?: string | null;
  initialTransactions: any[];
  accounts: any[];
  categories: any[];
  totalCount: number;
  serverPage: number;
  serverPageSize: number;
  serverTotalPages: number;
  serverSearch: string;
  serverSortField: string;
  serverSortOrder: "asc" | "desc";
  currency: string;
  onRefreshAll: () => Promise<void>;
}

type SortField = "transactionDate" | "type" | "category" | "account" | "amount" | "note";
type SortOrder = "asc" | "desc";

import { useI18n } from "@/lib/i18n/context";

export function TransactionsSheet({
  userId,
  familyId,
  initialTransactions,
  accounts,
  categories,
  totalCount,
  serverPage,
  serverPageSize,
  serverTotalPages,
  serverSearch,
  serverSortField,
  serverSortOrder,
  currency,
  onRefreshAll,
}: TransactionsSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict, locale } = useI18n();

  // Format initial records to editable sheet rows
  const mapTxToRow = (tx: any): TransactionRow => ({
    id: tx.id,
    transactionDate: tx.transactionDate || new Date().toISOString().split("T")[0],
    type: tx.type,
    categoryId: tx.categoryId || "",
    accountId: tx.accountId,
    toAccountId: tx.toAccountId || undefined,
    amount: parseFloat(tx.amount || "0"),
    note: tx.note || "",
    createdAt: tx.createdAt ? new Date(tx.createdAt).toISOString() : undefined,
  });

  const [rows, setRows] = useState<TransactionRow[]>(() =>
    initialTransactions.map(mapTxToRow)
  );

  const rowsRef = useRef<TransactionRow[]>(rows);
  rowsRef.current = rows;

  // Saving state tracking per row id: 'idle' | 'saving' | 'saved' | 'error'
  const [rowStatus, setRowStatus] = useState<Record<string, "saving" | "saved" | "error">>({});
  const rowStatusRef = useRef(rowStatus);
  rowStatusRef.current = rowStatus;

  // Filter & Search states (initialized from server props)
  const [searchQuery, setSearchQuery] = useState(serverSearch || "");
  const [sortField, setSortField] = useState<SortField>(
    (serverSortField as SortField) || "transactionDate"
  );
  const [sortOrder, setSortOrder] = useState<SortOrder>(serverSortOrder || "desc");
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [alertModal, setAlertModal] = useState<ModalAlertConfig>({
    isOpen: false,
    message: "",
  });

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Batch delete confirmation modal state
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  // Raw Database Inspector Modal state
  const [isDatabaseInspectorOpen, setIsDatabaseInspectorOpen] = useState(false);

  // Debounce timeout references
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to update URL params and trigger server refetch
  const updateUrlParams = (newParams: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === undefined || val === "") {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.push(`/transaction?${params.toString()}`);
  };

  // Sync searchQuery changes to URL (debounced)
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      updateUrlParams({ q: val.trim() || undefined, page: 1 });
    }, 400);
  };

  // Keep searchQuery state synced if server prop changes from external navigation
  useEffect(() => {
    setSearchQuery(serverSearch || "");
  }, [serverSearch]);

  useEffect(() => {
    setSortField((serverSortField as SortField) || "transactionDate");
    setSortOrder(serverSortOrder || "desc");
  }, [serverSortField, serverSortOrder]);

  // Sync state when initialTransactions changes (e.g. pagination, sort, search, or refresh)
  useEffect(() => {
    setRows((prev) => {
      // Keep any unsaved newly added rows created by user clicking "Tambah Baris"
      const unsavedNewRows = prev.filter((r) => r.isNew);
      const serverRows = initialTransactions.map(mapTxToRow);
      return [...unsavedNewRows, ...serverRows];
    });
  }, [initialTransactions]);

  // Helpers
  const formatCurrency = (val: number | string) => {
    return formatCurrencyValue(val, currency, locale);
  };

  const defaultAccount = accounts.find((a) => a.isDefault) || accounts[0];
  const defaultCategory =
    categories.find((c) => c.type === "expense") || categories[0];

  // Add new blank row at top with local user time
  function handleAddNewRow() {
    const today = getLocalTodayDateString();
    const newRowId = `new_${Date.now()}`;
    const newRow: TransactionRow = {
      id: newRowId,
      transactionDate: today,
      type: "expense",
      categoryId: defaultCategory?.id || "",
      accountId: defaultAccount?.id || "",
      toAccountId: accounts.length > 1 ? accounts[1].id : defaultAccount?.id,
      amount: 0,
      note: "",
      isNew: true,
    };

    setRows((prev) => [newRow, ...prev]);
  }

  // Update cell and trigger debounced auto-save
  function handleCellChange(id: string, field: keyof TransactionRow, value: any) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          // If switching to transfer, ensure toAccountId exists
          if (field === "type" && value === "transfer" && !updated.toAccountId) {
            const secondAcc = accounts.find((a) => a.id !== updated.accountId) || accounts[0];
            updated.toAccountId = secondAcc?.id;
          }
          return updated;
        }
        return r;
      })
    );

    // Trigger debounced save
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }

    debounceTimers.current[id] = setTimeout(() => {
      saveRow(id);
    }, 700);
  }

  // Save specific row
  async function saveRow(id: string) {
    const row = rowsRef.current.find((r) => r.id === id);
    if (!row) return;

    if (row.amount <= 0) {
      // Don't auto-save if amount not filled yet
      return;
    }

    setRowStatus((prev) => ({ ...prev, [id]: "saving" }));

    try {
      if (row.isNew) {
        if (row.type === "transfer" && (!row.toAccountId || row.accountId === row.toAccountId)) {
          throw new Error(dict.transaksi.errTransferSameWallet);
        }
        const res = await createTransaction({
          userId,
          familyId,
          accountId: row.accountId,
          toAccountId: row.type === "transfer" ? row.toAccountId : null,
          categoryId: row.type === "transfer" ? null : row.categoryId,
          amount: row.amount,
          type: row.type,
          note: row.note,
          transactionDate: row.transactionDate,
        });

        if (!res.success) {
          throw new Error(res.error);
        }

        // Replace temp new ID with real database ID and preserve createdAt
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  id: res.transaction.id,
                  isNew: false,
                  createdAt: res.transaction.createdAt
                    ? new Date(res.transaction.createdAt).toISOString()
                    : new Date().toISOString(),
                }
              : r
          )
        );
      } else {
        if (row.type === "transfer" && (!row.toAccountId || row.accountId === row.toAccountId)) {
          throw new Error(dict.transaksi.errTransferSameWallet);
        }
        const res = await updateTransaction(id, {
          userId,
          familyId,
          accountId: row.accountId,
          toAccountId: row.type === "transfer" ? row.toAccountId : null,
          categoryId: row.type === "transfer" ? null : row.categoryId,
          amount: row.amount,
          type: row.type,
          note: row.note,
          transactionDate: row.transactionDate,
        });

        if (!res.success) {
          throw new Error(res.error);
        }
      }

      setRowStatus((prev) => ({ ...prev, [id]: "saved" }));
      setTimeout(() => {
        setRowStatus((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }, 2000);

      await onRefreshAll();
    } catch (err: unknown) {
      console.error("Save row error:", err);
      setRowStatus((prev) => ({ ...prev, [id]: "error" }));
      const msg = err instanceof Error ? err.message : dict.transaksi.errSaveGeneric;
      const isBalanceErr = msg.toLowerCase().includes("saldo tidak mencukupi") || msg.toLowerCase().includes("insufficient");
      setAlertModal({
        isOpen: true,
        title: isBalanceErr ? dict.transaksi.insufficientBalanceTitle : dict.transaksi.errSaveTitle,
        message: msg,
        variant: isBalanceErr ? "warning" : "error",
      });
    }
  }


  // Confirmation delete modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    row: TransactionRow | null;
  }>({
    isOpen: false,
    row: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Trigger delete row
  function handleDeleteRow(row: TransactionRow) {
    if (row.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }

    setDeleteConfirmation({
      isOpen: true,
      row,
    });
  }

  // Execute confirmed row delete
  async function executeDeleteRow() {
    const row = deleteConfirmation.row;
    if (!row) return;

    setDeleteLoading(true);
    setRowStatus((prev) => ({ ...prev, [row.id]: "saving" }));

    try {
      const res = await deleteTransaction(row.id, userId, familyId);
      if (!res.success) {
        throw new Error(res.error);
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      setDeleteConfirmation({ isOpen: false, row: null });
      await onRefreshAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.transaksi.errDeleteGeneric;
      setAlertModal({
        isOpen: true,
        title: dict.transaksi.errDeleteTitle,
        message: msg,
        variant: "error",
      });
      setRowStatus((prev) => ({ ...prev, [row.id]: "error" }));
      setDeleteConfirmation({ isOpen: false, row: null });
    } finally {
      setDeleteLoading(false);
    }
  }

  // Selection handlers
  function toggleSelectRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAllVisible(visibleRows: TransactionRow[]) {
    const visibleIds = visibleRows.map((r) => r.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // Execute confirmed batch delete
  async function executeBatchDeleteRow() {
    const idsToDelete = Array.from(selectedIds);
    if (!idsToDelete.length) return;

    setBatchDeleteLoading(true);

    try {
      // Split between unsaved new rows (local only) and database persisted rows
      const newRowIds = idsToDelete.filter((id) => id.startsWith("new_"));
      const savedRowIds = idsToDelete.filter((id) => !id.startsWith("new_"));

      if (savedRowIds.length > 0) {
        const res = await deleteTransactionsBatch(savedRowIds, userId, familyId);
        if (!res.success) {
          throw new Error(res.error);
        }
      }

      setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      setIsBatchDeleteOpen(false);
      await onRefreshAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : dict.transaksi.errBatchDeleteGeneric;
      setAlertModal({
        isOpen: true,
        title: dict.transaksi.errDeleteTitle,
        message: msg,
        variant: "error",
      });
      setIsBatchDeleteOpen(false);
    } finally {
      setBatchDeleteLoading(false);
    }
  }

  // Sorting Handler - pushes sort query to URL
  function toggleSort(field: SortField) {
    const nextOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortOrder(nextOrder);
    updateUrlParams({ sort: field, order: nextOrder, page: 1 });
  }

  // Rows to display:
  // Any newly added unsaved rows (isNew) are prepended to the server page slice
  const displayRows = rows;
  const totalItems = totalCount;
  const totalPages = serverTotalPages;
  const safeCurrentPage = serverPage;

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Search, Add Row, Export/Import */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder={dict.transaksi.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-10 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setIsBatchDeleteOpen(true)}
                className="flex-1 sm:flex-initial h-10 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-all animate-in fade-in"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {dict.transaksi.btnDeleteSelected(selectedIds.size)}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
                className="h-10 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                {dict.common.cancel}
              </Button>
            </div>
          )}

          <Button
            type="button"
            onClick={() => setIsDatabaseInspectorOpen(true)}
            variant="outline"
            size="sm"
            title={dict.transaksi.btnInspectDatabase}
            className="flex-1 sm:flex-initial h-10 text-xs font-semibold border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
          >
            <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
            <span className="hidden xs:inline sm:inline">{dict.transaksi.btnInspectDatabase}</span>
          </Button>

          <Button
            type="button"
            onClick={() => setIsExportImportOpen(true)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-initial h-10 text-xs font-semibold border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            {dict.transaksi.btnExportImport}
          </Button>

          <Button
            type="button"
            onClick={handleAddNewRow}
            size="sm"
            className="flex-1 sm:flex-initial h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> {dict.transaksi.btnNewRow}
          </Button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 font-semibold select-none">
              <th className="p-3 w-12 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <input
                    type="checkbox"
                    aria-label="Select all visible rows"
                    checked={
                      displayRows.length > 0 &&
                      displayRows.every((r) => selectedIds.has(r.id))
                    }
                    onChange={() => toggleSelectAllVisible(displayRows)}
                    className="w-4 h-4 rounded-md border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                  />
                </div>
              </th>
              <th
                onClick={() => toggleSort("transactionDate")}
                className="p-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors w-36"
              >
                <div className="flex items-center gap-1">
                  <span>{dict.transaksi.colDate}</span>
                  {sortField === "transactionDate" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort("type")}
                className="p-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors w-32"
              >
                <div className="flex items-center gap-1">
                  <span>{dict.transaksi.colType}</span>
                  {sortField === "type" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort("category")}
                className="p-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors w-44"
              >
                <div className="flex items-center gap-1">
                  <span>{dict.transaksi.colCategory}</span>
                  {sortField === "category" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort("account")}
                className="p-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors w-52"
              >
                <div className="flex items-center gap-1">
                  <span>{dict.transaksi.colWallet}</span>
                  {sortField === "account" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort("amount")}
                className="p-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors w-36"
              >
                <div className="flex items-center gap-1">
                  <span>{dict.transaksi.colAmount(currency)}</span>
                  {sortField === "amount" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => toggleSort("note")}
                className="p-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors min-w-[180px]"
              >
                <div className="flex items-center gap-1">
                  <span>{dict.transaksi.colNote}</span>
                  {sortField === "note" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </th>
              <th className="p-3 w-28 text-center">{dict.transaksi.colActions}</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {displayRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-400 text-xs">
                  {dict.transaksi.emptyRows}
                </td>
              </tr>
            ) : (
              displayRows.map((row, index) => {
                const globalIndex = (safeCurrentPage - 1) * serverPageSize + index + 1;
                const status = rowStatus[row.id];
                const isSaving = status === "saving";
                const isSaved = status === "saved";
                const isError = status === "error";
                const isSelected = selectedIds.has(row.id);

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${
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
                          aria-label={`Pilih baris ${globalIndex}`}
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="w-4 h-4 rounded-md border-zinc-300 dark:border-zinc-700 text-emerald-600 focus:ring-emerald-500/20 cursor-pointer accent-emerald-600"
                        />
                        <span className="text-[10px] text-zinc-400 select-none hidden sm:inline-block w-4 text-left">
                          {globalIndex}
                        </span>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="p-2">
                      <div className="relative flex items-center">
                        <input
                          type="date"
                          value={row.transactionDate}
                          onChange={(e) =>
                            handleCellChange(row.id, "transactionDate", e.target.value)
                          }
                          className="w-full h-8 px-2.5 rounded-lg bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 hover:border-zinc-300 dark:hover:border-zinc-600 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs font-mono font-medium text-zinc-800 dark:text-zinc-200 outline-hidden transition-all shadow-2xs"
                        />
                      </div>
                    </td>

                    {/* Tipe */}
                    <td className="p-2">
                      <CustomSelect
                        value={row.type}
                        onChange={(val) =>
                          handleCellChange(row.id, "type", val as any)
                        }
                        options={[
                          { value: "expense", label: dict.txTypes.expense, badge: "out", badgeClassName: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" },
                          { value: "income", label: dict.txTypes.income, badge: "in", badgeClassName: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
                          { value: "transfer", label: dict.txTypes.transfer, badge: "tf", badgeClassName: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" },
                        ]}
                        triggerClassName={`h-8 font-semibold ${
                          row.type === "income"
                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30"
                            : row.type === "expense"
                            ? "text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30"
                            : "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30"
                        }`}
                      />
                    </td>

                    {/* Kategori */}
                    <td className="p-2">
                      {row.type === "transfer" ? (
                        <div className="text-[11px] text-zinc-400 italic px-2">
                          {dict.transaksi.internalTransfer}
                        </div>
                      ) : (
                        <CustomSelect
                          value={row.categoryId}
                          onChange={(val) =>
                            handleCellChange(row.id, "categoryId", val)
                          }
                          options={categories
                            .filter((c) => c.type === row.type)
                            .map((c) => ({
                              value: c.id,
                              label: c.name,
                              icon: c.icon || "🏷️",
                            }))}
                          triggerClassName="h-8"
                        />
                      )}
                    </td>

                    {/* Kantong */}
                    <td className="p-2">
                      {row.type === "transfer" ? (
                        <div className="flex items-center gap-1">
                          <CustomSelect
                            value={row.accountId}
                            onChange={(val) =>
                              handleCellChange(row.id, "accountId", val)
                            }
                            options={accounts.map((a) => ({
                              value: a.id,
                              label: a.name,
                              icon: a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱",
                            }))}
                            triggerClassName="h-8 border-zinc-200 dark:border-zinc-700"
                          />
                          <span className="text-[10px] text-zinc-400">➔</span>
                          <CustomSelect
                            value={row.toAccountId || ""}
                            onChange={(val) =>
                              handleCellChange(row.id, "toAccountId", val)
                            }
                            options={accounts.map((a) => ({
                              value: a.id,
                              label: a.name,
                              icon: a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱",
                            }))}
                            triggerClassName="h-8 border-zinc-200 dark:border-zinc-700"
                          />
                        </div>
                      ) : (
                        <CustomSelect
                          value={row.accountId}
                          onChange={(val) =>
                            handleCellChange(row.id, "accountId", val)
                          }
                          options={accounts.map((a) => ({
                            value: a.id,
                            label: a.name,
                            icon: a.type === "cash" ? "💵" : a.type === "bank" ? "🏦" : "📱",
                            badge: formatCurrency(parseFloat(a.balance)),
                            badgeClassName: "font-mono font-normal text-zinc-500",
                          }))}
                          triggerClassName="h-8"
                        />
                      )}
                    </td>

                    {/* Nominal */}
                    <td className="p-2">
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-xs font-semibold text-zinc-400 select-none pointer-events-none">
                          {getCurrencySymbol(currency)}
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.amount ? row.amount.toLocaleString(locale === "en" ? "en-US" : "id-ID") : ""}
                          onChange={(e) => {
                            // Strip everything except digits
                            const rawDigits = e.target.value.replace(/\D/g, "");
                            const numericVal = rawDigits ? parseInt(rawDigits, 10) : 0;
                            handleCellChange(row.id, "amount", numericVal);
                          }}
                          placeholder="0"
                          className="w-full h-8 pl-8 pr-2 rounded-lg bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs font-mono font-bold outline-hidden"
                        />
                      </div>
                    </td>

                    {/* Keterangan */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) =>
                          handleCellChange(row.id, "note", e.target.value)
                        }
                        placeholder={dict.transaksi.notePlaceholder}
                        className="w-full h-8 px-2 rounded-lg bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs outline-hidden"
                      />
                    </td>

                    {/* Status & Actions */}
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isSaving && (
                          <div className="relative group/tooltip flex items-center justify-center">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-amber-500 bg-amber-50/50 dark:bg-amber-950/20">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            </div>
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                              {dict.transaksi.statusSaving}
                            </span>
                          </div>
                        )}
                        {isSaved && (
                          <div className="relative group/tooltip flex items-center justify-center">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                              {dict.transaksi.statusSaved}
                            </span>
                          </div>
                        )}
                        {isError && (
                          <div className="relative group/tooltip flex items-center justify-center">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 bg-rose-50/50 dark:bg-rose-950/20">
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                              {dict.transaksi.statusError}
                            </span>
                          </div>
                        )}
                        {!isSaving && (
                          <div className="relative group/tooltip flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => saveRow(row.id)}
                              aria-label={dict.transaksi.tooltipSave}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                              {dict.transaksi.tooltipSave}
                            </span>
                          </div>
                        )}
                        <div className="relative group/tooltip flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row)}
                            aria-label={dict.transaksi.tooltipDelete}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-95 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 z-30 opacity-0 group-hover/tooltip:opacity-100 transition-opacity bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                            {dict.transaksi.tooltipDelete}
                          </span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Status Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400 px-1 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {dict.transaksi.paginationShowing(
              totalItems === 0 ? 0 : (safeCurrentPage - 1) * serverPageSize + 1,
              Math.min(safeCurrentPage * serverPageSize, totalItems),
              totalItems
            )}
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-zinc-400">{dict.transaksi.perPageLabel}</span>
            <CustomSelect
              value={String(serverPageSize)}
              onChange={(val) => updateUrlParams({ limit: Number(val), page: 1 })}
              options={[
                { value: "10", label: `10 / ${dict.transaksi.perPageOption}` },
                { value: "25", label: `25 / ${dict.transaksi.perPageOption}` },
                { value: "50", label: `50 / ${dict.transaksi.perPageOption}` },
                { value: "100", label: `100 / ${dict.transaksi.perPageOption}` },
              ]}
              triggerClassName="h-7 text-[11px] px-2.5 py-1 rounded-lg border-zinc-200 dark:border-zinc-800"
            />
          </div>
        </div>

        {/* Pagination Navigation */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateUrlParams({ page: 1 })}
            disabled={safeCurrentPage <= 1}
            title={dict.transaksi.pageFirst}
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateUrlParams({ page: Math.max(1, safeCurrentPage - 1) })}
            disabled={safeCurrentPage <= 1}
            title={dict.transaksi.pagePrev}
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-xs px-2 select-none">
            {dict.transaksi.pageCurrent(safeCurrentPage, totalPages)}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateUrlParams({ page: Math.min(totalPages, safeCurrentPage + 1) })}
            disabled={safeCurrentPage >= totalPages}
            title={dict.transaksi.pageNext}
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateUrlParams({ page: totalPages })}
            disabled={safeCurrentPage >= totalPages}
            title={dict.transaksi.pageLast}
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog for Transaction Row Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title={dict.transaksi.confirmDeleteRowTitle}
        description={dict.transaksi.confirmDeleteRowDesc}
        itemName={deleteConfirmation.row?.note || (deleteConfirmation.row?.amount ? formatCurrency(deleteConfirmation.row.amount) : dict.transaksi.defaultRowItemName)}
        isLoading={deleteLoading}
        onConfirm={executeDeleteRow}
        onClose={() => setDeleteConfirmation({ isOpen: false, row: null })}
      />

      {/* Confirmation Dialog for Batch Transactions Deletion */}
      <ConfirmDeleteModal
        isOpen={isBatchDeleteOpen}
        title={dict.transaksi.confirmDeleteBatchTitle}
        description={dict.transaksi.confirmDeleteBatchDesc(selectedIds.size)}
        itemName={dict.transaksi.confirmDeleteBatchItem(selectedIds.size)}
        isLoading={batchDeleteLoading}
        onConfirm={executeBatchDeleteRow}
        onClose={() => setIsBatchDeleteOpen(false)}
      />

      {/* Export & Import Modal */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        userId={userId}
        familyId={familyId}
        transactions={initialTransactions}
        accounts={accounts}
        categories={categories}
        onSuccess={async () => {
          await onRefreshAll();
        }}
      />

      {/* Dedicated Alert / Error Modal */}
      <AlertModal
        config={alertModal}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Raw Database Inspector Modal (Zero-Knowledge Live Proof) */}
      <DatabaseInspectorModal
        isOpen={isDatabaseInspectorOpen}
        onClose={() => setIsDatabaseInspectorOpen(false)}
        rows={rows}
      />
    </div>
  );
}
