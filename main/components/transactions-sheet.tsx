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
} from "lucide-react";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/app/actions/transactions";
import { transferBetweenAccounts } from "@/app/actions/accounts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { CustomSelect } from "@/components/ui/custom-select";
import { ExportImportModal } from "@/components/export-import-modal";
import { AlertModal, ModalAlertConfig } from "@/components/ui/alert-modal";
import { getLocalTodayDateString } from "@/lib/utils";

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
  onRefreshAll: () => Promise<void>;
}

type SortField = "transactionDate" | "type" | "category" | "account" | "amount" | "note";
type SortOrder = "asc" | "desc";

export function TransactionsSheet({
  userId,
  familyId,
  initialTransactions,
  accounts,
  categories,
  onRefreshAll,
}: TransactionsSheetProps) {
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

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("transactionDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [alertModal, setAlertModal] = useState<ModalAlertConfig>({
    isOpen: false,
    message: "",
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Debounce timeout references
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Reset to first page when search query or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Sync state when initialTransactions changes without wiping unsaved or actively edited rows
  useEffect(() => {
    setRows((prev) => {
      const serverMap = new Map(initialTransactions.map((tx) => [tx.id, mapTxToRow(tx)]));

      // Keep order of prev rows while updating with server data when safe
      const updatedPrev = prev.map((localRow) => {
        // Keep unsaved newly added rows
        if (localRow.isNew) return localRow;

        // If row is currently saving or has a pending debounced auto-save, preserve local changes
        if (rowStatusRef.current[localRow.id] === "saving" || debounceTimers.current[localRow.id]) {
          return localRow;
        }

        // Otherwise sync with server data if available
        return serverMap.get(localRow.id) || localRow;
      });

      // Prepend any server rows that are not in prev (e.g. added from Smart Input or another device)
      const prevIds = new Set(prev.map((p) => p.id));
      const newlyArrivedFromServer = initialTransactions
        .filter((tx) => !prevIds.has(tx.id))
        .map(mapTxToRow);

      return [...newlyArrivedFromServer, ...updatedPrev];
    });
  }, [initialTransactions]);

  // Helpers
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
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
    setCurrentPage(1); // Jump to page 1 so user immediately sees the newly added row
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
          throw new Error("Pilih kantong sumber dan tujuan yang berbeda.");
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
          source: "web",
          transactionDate: row.transactionDate,
        });
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
          throw new Error("Pilih kantong sumber dan tujuan yang berbeda.");
        }
        await updateTransaction(id, {
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
      const msg = err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      const isBalanceErr = msg.toLowerCase().includes("saldo tidak mencukupi");
      setAlertModal({
        isOpen: true,
        title: isBalanceErr ? "Saldo Tidak Mencukupi" : "Gagal Menyimpan Transaksi",
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
      await deleteTransaction(row.id, userId, familyId);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setDeleteConfirmation({ isOpen: false, row: null });
      await onRefreshAll();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus transaksi.";
      setAlertModal({
        isOpen: true,
        title: "Gagal Menghapus Transaksi",
        message: msg,
        variant: "error",
      });
      setRowStatus((prev) => ({ ...prev, [row.id]: "error" }));
      setDeleteConfirmation({ isOpen: false, row: null });
    } finally {
      setDeleteLoading(false);
    }
  }

  // Sorting Handler
  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  // Filter & Sort computation
  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    // Search filter across note, category, account, amount, and date
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const cat = categories.find((c) => c.id === r.categoryId)?.name.toLowerCase() || "";
        const acc = accounts.find((a) => a.id === r.accountId)?.name.toLowerCase() || "";
        const toAcc = accounts.find((a) => a.id === r.toAccountId)?.name.toLowerCase() || "";
        const note = r.note.toLowerCase();
        const date = r.transactionDate;
        const amountStr = r.amount.toString();

        return (
          note.includes(q) ||
          cat.includes(q) ||
          acc.includes(q) ||
          toAcc.includes(q) ||
          date.includes(q) ||
          amountStr.includes(q)
        );
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA: any = a[sortField as keyof TransactionRow];
      let valB: any = b[sortField as keyof TransactionRow];

      if (sortField === "category") {
        valA = categories.find((c) => c.id === a.categoryId)?.name || "";
        valB = categories.find((c) => c.id === b.categoryId)?.name || "";
      } else if (sortField === "account") {
        valA = accounts.find((acc) => acc.id === a.accountId)?.name || "";
        valB = accounts.find((acc) => acc.id === b.accountId)?.name || "";
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;

      // Tie breaker: if sorting by transactionDate (or values are identical), prioritize newest created / unsaved row
      if (sortField === "transactionDate") {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) {
          return timeB - timeA; // newest createdAt first
        }
      }

      return 0;
    });

    return result;
  }, [rows, searchQuery, sortField, sortOrder, categories, accounts]);

  // Pagination calculation
  const totalItems = filteredAndSortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredAndSortedRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedRows, safeCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Top Toolbar: Search, Add Row, Export/Import */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Cari transaksi (keterangan, nominal, tanggal, kategori, dompet)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-xs bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            onClick={() => setIsExportImportOpen(true)}
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-initial h-10 text-xs font-semibold border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-600" />
            Ekspor / Impor
          </Button>

          <Button
            type="button"
            onClick={handleAddNewRow}
            size="sm"
            className="flex-1 sm:flex-initial h-10 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Baris Baru (Row)
          </Button>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-100/80 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 font-semibold select-none">
              <th className="p-3 w-10 text-center">#</th>
              <th
                onClick={() => toggleSort("transactionDate")}
                className="p-3 cursor-pointer hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50 transition-colors w-36"
              >
                <div className="flex items-center gap-1">
                  <span>Tanggal</span>
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
                  <span>Tipe</span>
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
                  <span>Kategori</span>
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
                  <span>Kantong / Dompet</span>
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
                  <span>Nominal (Rp)</span>
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
                  <span>Keterangan</span>
                  {sortField === "note" ? (
                    sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                  )}
                </div>
              </th>
              <th className="p-3 w-20 text-center">Status / Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-zinc-400 text-xs">
                  Tidak ada transaksi yang cocok. Klik tombol <b>+ Baris Baru</b> untuk mulai mencatat.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, index) => {
                const globalIndex = (safeCurrentPage - 1) * itemsPerPage + index + 1;
                const status = rowStatus[row.id];
                const isSaving = status === "saving";
                const isSaved = status === "saved";
                const isError = status === "error";

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-emerald-500/[0.02] transition-colors ${
                      row.isNew ? "bg-amber-500/[0.04]" : ""
                    }`}
                  >
                    {/* Index */}
                    <td className="p-2.5 text-center text-[11px] text-zinc-400 font-mono">
                      {globalIndex}
                    </td>

                    {/* Tanggal */}
                    <td className="p-2">
                      <input
                        type="date"
                        value={row.transactionDate}
                        onChange={(e) =>
                          handleCellChange(row.id, "transactionDate", e.target.value)
                        }
                        className="w-full h-8 px-2 rounded-lg bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs font-mono outline-hidden"
                      />
                    </td>

                    {/* Tipe */}
                    <td className="p-2">
                      <CustomSelect
                        value={row.type}
                        onChange={(val) =>
                          handleCellChange(row.id, "type", val as any)
                        }
                        options={[
                          { value: "expense", label: "Pengeluaran", badge: "out", badgeClassName: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" },
                          { value: "income", label: "Pemasukan", badge: "in", badgeClassName: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
                          { value: "transfer", label: "Transfer", badge: "tf", badgeClassName: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" },
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
                          Mutasi Internal
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
                            badge: formatRupiah(parseFloat(a.balance)),
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
                          Rp
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.amount ? row.amount.toLocaleString("id-ID") : ""}
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
                        placeholder="Keterangan..."
                        className="w-full h-8 px-2 rounded-lg bg-transparent border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-zinc-800 text-xs outline-hidden"
                      />
                    </td>

                    {/* Status & Actions */}
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isSaving && (
                          <span title="Menyimpan otomatis...">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          </span>
                        )}
                        {isSaved && (
                          <span title="Tersimpan!">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </span>
                        )}
                        {isError && (
                          <span title="Gagal disimpan">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          </span>
                        )}
                        {!isSaving && (
                          <button
                            type="button"
                            onClick={() => saveRow(row.id)}
                            title="Simpan baris ini"
                            className="p-1 rounded text-zinc-400 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row)}
                          title="Hapus baris"
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
            Menampilkan{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {totalItems === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            -{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {Math.min(safeCurrentPage * itemsPerPage, totalItems)}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{totalItems}</span>{" "}
            transaksi
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-zinc-400">Tampilkan:</span>
            <CustomSelect
              value={String(itemsPerPage)}
              onChange={(val) => setItemsPerPage(Number(val))}
              options={[
                { value: "10", label: "10 / hal" },
                { value: "25", label: "25 / hal" },
                { value: "50", label: "50 / hal" },
                { value: "100", label: "100 / hal" },
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
            onClick={() => setCurrentPage(1)}
            disabled={safeCurrentPage <= 1}
            title="Halaman Pertama"
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safeCurrentPage <= 1}
            title="Halaman Sebelumnya"
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-xs px-2 select-none">
            Hal <span className="font-semibold text-zinc-800 dark:text-zinc-200">{safeCurrentPage}</span> dari{" "}
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{totalPages}</span>
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safeCurrentPage >= totalPages}
            title="Halaman Berikutnya"
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={safeCurrentPage >= totalPages}
            title="Halaman Terakhir"
            className="h-8 w-8 p-0 rounded-lg border-zinc-200 dark:border-zinc-800"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog for Transaction Row Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title="Hapus Transaksi"
        description="Apakah kamu yakin ingin menghapus baris transaksi ini? Saldo kantong terkait akan otomatis disesuaikan kembali."
        itemName={deleteConfirmation.row?.note || (deleteConfirmation.row?.amount ? `Rp ${deleteConfirmation.row.amount.toLocaleString("id-ID")}` : "Baris Transaksi")}
        isLoading={deleteLoading}
        onConfirm={executeDeleteRow}
        onClose={() => setDeleteConfirmation({ isOpen: false, row: null })}
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
    </div>
  );
}
