"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Tag,
  PiggyBank,
  Plus,
  Trash2,
  Edit2,
  X,
  RefreshCw,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/app/actions/accounts";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { CustomSelect } from "@/components/ui/custom-select";

import { useI18n } from "@/lib/i18n/context";
import { formatCurrencyValue } from "@/lib/currency";
import { PRESET_CATEGORY_ICONS, getCategoryIcon } from "@/lib/category-icons";

interface ModalProps {
  userId: string;
  familyId?: string | null;
  accounts: any[];
  categories: any[];
  currency?: string;
  onRefresh: () => Promise<void>;
}

export function QuickModals({
  userId,
  familyId,
  accounts,
  categories,
  currency = "IDR",
  onRefresh,
}: ModalProps) {
  const { dict, locale } = useI18n();
  const [activeModal, setActiveModal] = useState<"saldo" | "kategori" | "kantong" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Kantong CRUD
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<string>("cash");
  const [accountBalance, setAccountBalance] = useState<string>("0");

  // States for Kategori CRUD
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"income" | "expense">("expense");
  const [categoryIcon, setCategoryIcon] = useState("💸");

  // State for Confirmation Delete Modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    type: "account" | "category";
    target: any;
  }>({
    isOpen: false,
    type: "account",
    target: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Close modal when pressing Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && activeModal && !deleteConfirmation.isOpen) {
        setActiveModal(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, deleteConfirmation.isOpen]);

  function openModal(modal: "saldo" | "kategori" | "kantong") {
    setError(null);
    setActiveModal(modal);
    resetAccountForm();
    resetCategoryForm();
  }

  function resetAccountForm() {
    setEditingAccount(null);
    setAccountName("");
    setAccountType("cash");
    setAccountBalance("0");
  }

  function resetCategoryForm() {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryType("expense");
    setCategoryIcon("💸");
  }

  // Account Handlers
  async function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountName.trim()) {
      setError(dict.quickModals.errWalletNameReq);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, userId, {
          name: accountName,
          type: accountType,
        }, familyId);
      } else {
        await createAccount({
          userId,
          familyId,
          name: accountName,
          type: accountType,
          balance: parseFloat(accountBalance) || 0,
        });
      }
      resetAccountForm();
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function triggerDeleteAccount(acc: any) {
    setDeleteConfirmation({
      isOpen: true,
      type: "account",
      target: acc,
    });
  }

  async function executeDeleteAccount() {
    if (!deleteConfirmation.target) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await deleteAccount(deleteConfirmation.target.id, userId, familyId);
      if (!res.success) {
        throw new Error(res.error);
      }
      setDeleteConfirmation({ isOpen: false, type: "account", target: null });
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleteConfirmation({ isOpen: false, type: "account", target: null });
    } finally {
      setDeleteLoading(false);
    }
  }

  // Category Handlers
  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) {
      setError(dict.quickModals.errCategoryNameReq);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (editingCategory) {
        const res = await updateCategory(editingCategory.id, userId, {
          name: categoryName,
          type: categoryType,
          icon: categoryIcon,
        }, familyId);
        if (!res.success) {
          throw new Error(res.error);
        }
      } else {
        await createCategory({
          userId,
          familyId,
          name: categoryName,
          type: categoryType,
          icon: categoryIcon,
        });
      }
      resetCategoryForm();
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function triggerDeleteCategory(cat: any) {
    setDeleteConfirmation({
      isOpen: true,
      type: "category",
      target: cat,
    });
  }

  async function executeDeleteCategory() {
    if (!deleteConfirmation.target) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await deleteCategory(deleteConfirmation.target.id, userId, familyId);
      if (!res.success) {
        throw new Error(res.error);
      }
      setDeleteConfirmation({ isOpen: false, type: "category", target: null });
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setDeleteConfirmation({ isOpen: false, type: "category", target: null });
    } finally {
      setDeleteLoading(false);
    }
  }

  const formatCurrency = (val: number | string) => {
    return formatCurrencyValue(val, currency, locale);
  };

  const totalSaldo = accounts.reduce((sum, a) => sum + (parseFloat(a.balance) || 0), 0);

  return (
    <div className="space-y-3">
      {/* Spotlight Quick Action Chips */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none select-none">
        <button
          type="button"
          onClick={() => openModal("saldo")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <div className="p-1 rounded-lg bg-emerald-500 text-white shadow-2xs">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span>{dict.quickModals.btnSaldo}</span>
        </button>

        <button
          type="button"
          onClick={() => openModal("kantong")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <div className="p-1 rounded-lg bg-amber-500 text-white shadow-2xs">
            <PiggyBank className="w-3.5 h-3.5" />
          </div>
          <span>{dict.quickModals.btnKantong}</span>
        </button>

        <button
          type="button"
          onClick={() => openModal("kategori")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <div className="p-1 rounded-lg bg-purple-500 text-white shadow-2xs">
            <Tag className="w-3.5 h-3.5" />
          </div>
          <span>{dict.quickModals.btnKategori}</span>
        </button>
      </div>

      {/* MODAL DIALOG CONTAINER */}
      {activeModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveModal(null);
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                {activeModal === "saldo" && <Wallet className="w-5 h-5 text-emerald-600" />}
                {activeModal === "kantong" && <PiggyBank className="w-5 h-5 text-emerald-600" />}
                {activeModal === "kategori" && <Tag className="w-5 h-5 text-emerald-600" />}
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 capitalize">
                  {activeModal === "saldo" && dict.quickModals.titleSaldo}
                  {activeModal === "kantong" && dict.quickModals.titleKantong}
                  {activeModal === "kategori" && dict.quickModals.titleKategori}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. MODAL SALDO (READ ONLY) */}
            {activeModal === "saldo" && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
                  <div className="text-xs text-emerald-100 font-medium">{dict.quickModals.totalWealth}</div>
                  <div className="text-2xl font-black mt-1">{formatCurrency(totalSaldo)}</div>
                  <div className="text-[11px] text-emerald-100/80 mt-1">
                    {dict.quickModals.wealthDesc(accounts.length)}
                  </div>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {accounts.map((acc) => (
                    <div key={acc.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">
                          {acc.type === "cash" ? "💵" : acc.type === "bank" ? "🏦" : "📱"}
                        </span>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {acc.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                            {acc.type} {acc.isDefault ? `• ${dict.quickModals.defaultBadge}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">
                        {formatCurrency(acc.balance)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. MODAL KANTONG (CRUD) */}
            {activeModal === "kantong" && (
              <div className="space-y-5">
                <form onSubmit={handleSaveAccount} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {editingAccount ? `${dict.quickModals.editWallet}: ${editingAccount.name}` : `➕ ${dict.quickModals.addWallet}`}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-zinc-500 font-medium">{dict.quickModals.walletNameLabel}</label>
                      <Input
                        placeholder={dict.quickModals.walletNamePlaceholder}
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-500 font-medium">{dict.quickModals.walletTypeLabel}</label>
                      <CustomSelect
                        value={accountType}
                        onChange={(val) => setAccountType(val)}
                        options={[
                          { value: "cash", label: dict.quickModals.cashType, icon: "💵" },
                          { value: "bank", label: dict.quickModals.bankType, icon: "🏦" },
                          { value: "ewallet", label: dict.quickModals.ewalletType, icon: "📱" },
                        ]}
                        triggerClassName="h-9 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>

                  {!editingAccount && (
                    <div>
                      <label className="text-[11px] text-zinc-500 font-medium">{dict.quickModals.initialBalanceLabel}</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={accountBalance}
                        onChange={(e) => setAccountBalance(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={loading} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                      {editingAccount ? dict.quickModals.btnUpdateWallet : dict.quickModals.btnSaveWallet}
                    </Button>
                    {editingAccount && (
                      <Button type="button" variant="outline" size="sm" onClick={resetAccountForm} className="h-8 text-xs cursor-pointer">
                        {dict.common.cancel}
                      </Button>
                    )}
                  </div>
                </form>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {dict.quickModals.activeWallets(accounts.length)}
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {accounts.map((acc) => (
                      <div key={acc.id} className="py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span>{acc.type === "cash" ? "💵" : acc.type === "bank" ? "🏦" : "📱"}</span>
                          <div>
                            <span className="font-semibold">{acc.name}</span>
                            <span className="ml-2 text-zinc-400 font-mono">{formatCurrency(acc.balance)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAccount(acc);
                              setAccountName(acc.name);
                              setAccountType(acc.type);
                            }}
                            className="p-1 rounded text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerDeleteAccount(acc)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. MODAL KATEGORI (CRUD) */}
            {activeModal === "kategori" && (
              <div className="space-y-5">
                <form onSubmit={handleSaveCategory} className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 space-y-3">
                  <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {editingCategory ? `${dict.quickModals.editCategory}: ${editingCategory.name}` : `➕ ${dict.quickModals.addCategory}`}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-zinc-500 font-medium">{dict.quickModals.categoryNameLabel}</label>
                      <Input
                        placeholder={dict.quickModals.categoryNamePlaceholder}
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-zinc-500 font-medium">{dict.quickModals.categoryTypeLabel}</label>
                      <CustomSelect
                        value={categoryType}
                        onChange={(val) => {
                          const newType = val as "income" | "expense";
                          setCategoryType(newType);
                          // Suggest appropriate default icon when switching types if using default
                          if (categoryIcon === "💸" && newType === "income") setCategoryIcon("💰");
                          if (categoryIcon === "💰" && newType === "expense") setCategoryIcon("💸");
                        }}
                        options={[
                          { value: "expense", label: dict.quickModals.expenseType, badge: "out", badgeClassName: "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300" },
                          { value: "income", label: dict.quickModals.incomeType, badge: "in", badgeClassName: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300" },
                        ]}
                        triggerClassName="h-9 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                      />
                    </div>
                  </div>

                  {/* Custom Icon Picker & Preset Strip */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-zinc-500 font-medium">{dict.quickModals.categoryIconLabel}</label>
                      <span className="text-[10px] text-zinc-400">Preset emoji</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative w-12 shrink-0">
                        <Input
                          value={categoryIcon}
                          onChange={(e) => setCategoryIcon(e.target.value)}
                          placeholder="💸"
                          className="h-9 text-center text-lg p-0"
                          maxLength={6}
                        />
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto py-1 px-1 rounded-lg bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 scrollbar-none flex-1">
                        {(PRESET_CATEGORY_ICONS[categoryType] || PRESET_CATEGORY_ICONS.expense).map((preset) => {
                          const isSelected = categoryIcon === preset;
                          return (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setCategoryIcon(preset)}
                              className={`p-1 text-sm rounded-md transition-all shrink-0 cursor-pointer hover:scale-115 ${
                                isSelected
                                  ? "bg-white dark:bg-zinc-800 shadow-xs ring-1 ring-emerald-500"
                                  : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                              }`}
                            >
                              {preset}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button type="submit" size="sm" disabled={loading} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 cursor-pointer">
                      {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                      {editingCategory ? dict.quickModals.btnUpdateCategory : dict.quickModals.btnSaveCategory}
                    </Button>
                    {editingCategory && (
                      <Button type="button" variant="outline" size="sm" onClick={resetCategoryForm} className="h-8 text-xs cursor-pointer">
                        {dict.common.cancel}
                      </Button>
                    )}
                  </div>
                </form>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {dict.quickModals.activeCategories(categories.length)}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                    {categories.map((cat) => {
                      const isProtected = cat.isDefault || (!cat.userId && !cat.familyId);
                      const iconDisplay = getCategoryIcon(cat);
                      return (
                        <div key={cat.id} className="py-2 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-base shrink-0">{iconDisplay}</span>
                            <div>
                              <span className="font-semibold">{cat.name}</span>
                              <span className={`ml-2 text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                cat.type === "income"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                {cat.type === "income" ? "in" : "out"}
                              </span>
                              {isProtected && (
                                <span className="ml-1 text-[10px] text-zinc-400">({dict.quickModals.defaultCategoryBadge})</span>
                              )}
                            </div>
                          </div>
                          {!isProtected && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory(cat);
                                  setCategoryName(cat.name);
                                  setCategoryType(cat.type);
                                  setCategoryIcon(getCategoryIcon(cat));
                                }}
                                className="p-1 rounded text-zinc-500 hover:text-emerald-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerDeleteCategory(cat)}
                                className="p-1 rounded text-zinc-500 hover:text-rose-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Kantong & Kategori Deletion */}
      <ConfirmDeleteModal
        isOpen={deleteConfirmation.isOpen}
        title={
          deleteConfirmation.type === "account"
            ? dict.quickModals.confirmDeleteWalletTitle
            : dict.quickModals.confirmDeleteCategoryTitle
        }
        description={
          deleteConfirmation.type === "account"
            ? dict.quickModals.confirmDeleteWalletDesc
            : dict.quickModals.confirmDeleteCategoryDesc
        }
        itemName={deleteConfirmation.target?.name}
        isLoading={deleteLoading}
        onConfirm={
          deleteConfirmation.type === "account"
            ? executeDeleteAccount
            : executeDeleteCategory
        }
        onClose={() =>
          setDeleteConfirmation({ isOpen: false, type: "account", target: null })
        }
      />
    </div>
  );
}
