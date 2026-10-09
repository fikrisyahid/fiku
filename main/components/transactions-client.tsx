"use client";

import { useRouter } from "next/navigation";
import { QuickModals } from "./quick-modals";
import { SmartInputBar } from "./smart-input-bar";
import { TransactionsSheet } from "./transactions-sheet";

interface TransactionsClientProps {
  userId: string;
  familyId?: string | null;
  accounts: any[];
  categories: any[];
  initialTransactions: any[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  currentSearch: string;
  currentSortField: string;
  currentSortOrder: "asc" | "desc";
  userSettings: any;
}

export function TransactionsClient({
  userId,
  familyId,
  accounts,
  categories,
  initialTransactions,
  totalCount,
  currentPage,
  pageSize,
  totalPages,
  currentSearch,
  currentSortField,
  currentSortOrder,
  userSettings,
}: TransactionsClientProps) {
  const router = useRouter();

  async function handleRefreshAll() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* 1. Quick Modals Strip (/saldo, /kantong, /kategori) */}
      <QuickModals
        userId={userId}
        familyId={familyId}
        accounts={accounts}
        categories={categories}
        currency={userSettings?.currency || "IDR"}
        onRefresh={handleRefreshAll}
      />

      {/* 2. Smart Natural Language Input Bar */}
      <SmartInputBar
        userId={userId}
        familyId={familyId}
        onSuccess={handleRefreshAll}
      />

      {/* 3. Live Excel / Google Sheet Table */}
      <TransactionsSheet
        userId={userId}
        familyId={familyId}
        initialTransactions={initialTransactions}
        accounts={accounts}
        categories={categories}
        totalCount={totalCount}
        serverPage={currentPage}
        serverPageSize={pageSize}
        serverTotalPages={totalPages}
        serverSearch={currentSearch}
        serverSortField={currentSortField}
        serverSortOrder={currentSortOrder}
        currency={userSettings?.currency || "IDR"}
        onRefreshAll={handleRefreshAll}
      />
    </div>
  );
}
