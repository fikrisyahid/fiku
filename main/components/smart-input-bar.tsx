"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { processSmartTextInput } from "@/lib/smart-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertModal, ModalAlertConfig } from "@/components/ui/alert-modal";
import { getLocalTodayDateString } from "@/lib/utils";

interface SmartInputBarProps {
  userId: string;
  familyId?: string | null;
  onSuccess: () => Promise<void>;
}

export function SmartInputBar({ userId, familyId, onSuccess }: SmartInputBarProps) {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertModal, setAlertModal] = useState<ModalAlertConfig>({
    isOpen: false,
    message: "",
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  async function handleSmartSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setFeedback(null);

    try {
      const res = await processSmartTextInput({
        userId,
        familyId,
        text: inputText,
        transactionDate: getLocalTodayDateString(),
      });

      if (res.success) {
        setFeedback({
          type: "success",
          message: res.message,
        });
        setInputText("");
        await onSuccess();
      } else {
        const isBalanceErr = res.message.toLowerCase().includes("saldo tidak mencukupi");
        if (isBalanceErr) {
          setAlertModal({
            isOpen: true,
            title: "Saldo Tidak Mencukupi",
            message: res.message,
            variant: "warning",
          });
        }
        setFeedback({
          type: "error",
          message: res.message,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      const isBalanceErr = msg.toLowerCase().includes("saldo tidak mencukupi");
      if (isBalanceErr) {
        setAlertModal({
          isOpen: true,
          title: "Saldo Tidak Mencukupi",
          message: msg,
          variant: "warning",
        });
      }
      setFeedback({
        type: "error",
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-2">
      <form onSubmit={handleSmartSubmit} className="relative flex items-center shadow-sm rounded-2xl group">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-emerald-600 dark:text-emerald-400">
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>
        <Input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={loading}
          placeholder='Smart input, misal: "-25k sayur cash" atau "tf 100k bca ke gopay"'
          className="h-12 pl-10 pr-24 sm:pr-28 rounded-2xl text-xs sm:text-sm bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 focus:border-emerald-500 focus:ring-emerald-500/20 font-medium placeholder:text-zinc-400 placeholder:truncate"
        />
        <div className="absolute right-1.5 flex items-center">
          <Button
            type="submit"
            disabled={loading || !inputText.trim()}
            size="sm"
            className="h-9 px-3 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="inline-flex items-center gap-1">
                Catat <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </div>
      </form>

      {feedback && (
        <div
          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-1 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dedicated Alert / Insufficient Balance Modal */}
      <AlertModal
        config={alertModal}
        onClose={() => setAlertModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
