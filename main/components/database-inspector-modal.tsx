"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Database,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";

interface TransactionRow {
  id: string;
  transactionDate: string;
  type: "income" | "expense" | "transfer";
  amount: number | string;
  rawAmount?: string;
  note: string;
  rawNote?: string;
  accountId: string;
  account?: {
    name: string;
    rawBalance?: string;
    balance?: string | number;
  };
}

interface DatabaseInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: TransactionRow[];
}

export function DatabaseInspectorModal({
  isOpen,
  onClose,
  rows,
}: DatabaseInspectorModalProps) {
  const { locale } = useI18n();
  const isId = locale === "id";

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  function copyText(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Sample the first 5 transactions that have rawAmount or standard rows
  const sampleRows = rows.slice(0, 8);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 text-emerald-400 border border-zinc-800 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-zinc-50">
                  {isId ? "Raw Database Inspector (Zero-Knowledge Proof)" : "Raw Database Inspector (Zero-Knowledge Proof)"}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-semibold">
                  LIVE DB
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {isId
                  ? "Bandingkan langsung tampilan data di layar Anda dengan wujud fisik data yang tersimpan di server PostgreSQL kami."
                  : "Compare how data appears in your unlocked browser vs how it physically rests in our PostgreSQL database."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explain Banner */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-start gap-3 text-xs leading-relaxed">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-zinc-700 dark:text-zinc-300 font-medium">
              {isId
                ? "Server Fiku tidak pernah menyimpan nominal atau catatan Anda dalam bentuk teks telanjang."
                : "Fiku servers never persist your transaction amounts or notes in plaintext."}
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              {isId
                ? "Format string 'enc:v1:...' di bawah adalah paket kriptografi AES-256-GCM berisi Ephemeral Public Key, IV acak, Auth Tag integritas, dan Ciphertext."
                : "The 'enc:v1:...' payload below is an AES-256-GCM cryptographic envelope comprising Ephemeral Public Key, random IV, integrity Auth Tag, and Ciphertext."}
            </p>
          </div>
        </div>

        {/* Rows Comparison List */}
        <div className="space-y-3">
          {sampleRows.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              {isId ? "Belum ada transaksi untuk diinspeksi." : "No transactions available to inspect."}
            </div>
          ) : (
            sampleRows.map((row, idx) => {
              const displayAmount =
                typeof row.amount === "number"
                  ? `Rp ${row.amount.toLocaleString(isId ? "id-ID" : "en-US")}`
                  : `Rp ${row.amount}`;
              const cipherAmount = row.rawAmount || "(Encrypted AES-256-GCM)";
              const cipherNote = row.rawNote || "(Encrypted AES-256-GCM)";

              return (
                <div
                  key={row.id || idx}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs"
                >
                  <div className="px-4 py-2 bg-zinc-100/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-mono text-[11px]">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Row #{idx + 1} • {row.transactionDate} ({row.type.toUpperCase()})
                    </span>
                    <span className="text-zinc-400 text-[10px]">ID: {row.id.slice(0, 10)}...</span>
                  </div>

                  <div className="p-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Left: What You See */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isId ? "Tampilan Anda (Decrypted)" : "Your View (Decrypted)"}</span>
                      </div>
                      <div className="space-y-0.5 text-xs">
                        <div>
                          <strong className="text-zinc-800 dark:text-zinc-200">{displayAmount}</strong>
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400 truncate">
                          {row.note || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Right: What DB Server Sees */}
                    <div className="space-y-1.5 p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-zinc-300">
                      <div className="flex items-center justify-between text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{isId ? "Database Server (Ciphertext)" : "Database Server (Ciphertext)"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(cipherAmount, row.id)}
                          className="text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1 cursor-pointer font-sans normal-case"
                        >
                          {copiedId === row.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="space-y-1">
                        <div className="truncate text-emerald-400 select-all" title={cipherAmount}>
                          amount: {cipherAmount}
                        </div>
                        <div className="truncate text-amber-400 select-all" title={cipherNote}>
                          note: {cipherNote}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <Link
            href="/security"
            target="_blank"
            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>{isId ? "Pelajari Arsitektur Kriptografi Kami" : "Learn Our Cryptographic Architecture"}</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <Button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-9 px-5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold text-xs"
          >
            {isId ? "Tutup" : "Close"}
          </Button>
        </div>
      </div>
    </div>
  );
}
