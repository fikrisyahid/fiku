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
}

export function TransactionsClient({
  userId,
  familyId,
  accounts,
  categories,
  initialTransactions,
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
        onRefreshAll={handleRefreshAll}
      />
    </div>
  );
}
