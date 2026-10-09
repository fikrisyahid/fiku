"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Coins,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  User,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomSelect } from "@/components/ui/custom-select";
import { updateUserCurrency } from "@/app/actions/settings";
import {
  SUPPORTED_CURRENCIES,
  formatCurrencyValue,
  getCurrencySymbol,
} from "@/lib/currency";
import { useI18n } from "@/lib/i18n/context";

interface SettingsClientProps {
  userId: string;
  user: {
    fullName: string;
    email: string;
  };
  initialCurrency: string;
}

export function SettingsClient({
  userId,
  user,
  initialCurrency,
}: SettingsClientProps) {
  const router = useRouter();
  const { dict, locale } = useI18n();
  const [currency, setCurrency] = useState(initialCurrency);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedConfig =
    SUPPORTED_CURRENCIES.find((c) => c.code === currency) ||
    SUPPORTED_CURRENCIES[0];

  async function handleCurrencyChange(newCurrency: string) {
    if (newCurrency === currency) return;
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateUserCurrency(userId, newCurrency);
      setCurrency(newCurrency);
      setSuccessMsg(dict.settings.saveSuccess);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || dict.settings.saveError);
    } finally {
      setLoading(false);
    }
  }

  // Sample values for format preview
  const sampleValues = [15000, 250000, 5000000];

  return (
    <div className="space-y-8">
      {/* 1. Currency Settings Section */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-900/60">
              <Coins className="w-3.5 h-3.5" />
              <span>{dict.settings.currencySectionTitle}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 pt-1">
              {dict.settings.currencySectionTitle}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {dict.settings.currencySectionDesc}
            </p>
          </div>
        </div>

        {/* Currency Selector Grid */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">
            {dict.settings.currencyLabel}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {SUPPORTED_CURRENCIES.map((curr) => {
              const isSelected = curr.code === currency;
              return (
                <button
                  key={curr.code}
                  type="button"
                  onClick={() => handleCurrencyChange(curr.code)}
                  disabled={loading}
                  className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-24 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-600/20 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono">
                      {curr.symbol}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                        {loading ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3 stroke-[3]" />
                        )}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold tracking-tight">
                      {curr.code}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {curr.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1">
            {dict.settings.currencyHelp}
          </p>
        </div>

        {/* Live Preview Cards */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{dict.settings.previewTitle}</span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {dict.settings.previewDesc}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {sampleValues.map((val) => (
              <div
                key={val}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 shadow-2xs"
              >
                {formatCurrencyValue(val, currency, locale)}
              </div>
            ))}
          </div>
        </div>

        {/* Feedback Messages */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs font-medium text-rose-800 dark:text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. Account Profile Details */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold">
            <User className="w-3.5 h-3.5" />
            <span>{dict.settings.accountSectionTitle}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 pt-1">
            {dict.settings.accountSectionTitle}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {dict.settings.accountSectionDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium block">
              {dict.settings.userNameLabel}
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {user.fullName || "-"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] text-zinc-400 font-medium block">
              {dict.settings.userEmailLabel}
            </span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
              {user.email || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Zero-Knowledge Security Notice */}
      <div className="p-6 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex flex-col sm:flex-row items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
            {dict.settings.securityNoticeTitle}
          </h3>
          <p className="text-xs text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
            {dict.settings.securityNoticeDesc}
          </p>
        </div>
      </div>
    </div>
  );
}
