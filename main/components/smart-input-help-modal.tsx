"use client";

import { useEffect, useRef } from "react";
import { Info, X, Sparkles, ArrowRightLeft, ArrowDownRight, ArrowUpRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SmartInputHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExample?: (example: string) => void;
}

export function SmartInputHelpModal({
  isOpen,
  onClose,
  onSelectExample,
}: SmartInputHelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const exampleSections = [
    {
      title: "Pengeluaran Cepat",
      badge: "Expense",
      badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-900",
      icon: ArrowDownRight,
      iconColor: "text-rose-500",
      desc: "Ketik nominal (pakai tanda - atau langsung angka), keterangan, lalu nama kantong di akhir.",
      examples: [
        { text: "-25k kopi susu bca", note: "Keluar Rp 25.000 kategori Makan & Minum dari BCA" },
        { text: "50rb bensin spbu mandiri", note: "Keluar Rp 50.000 kategori Transport dari Mandiri" },
        { text: "-150.000 belanja mingguan cash", note: "Keluar Rp 150.000 dari dompet Cash/Tunai" },
        { text: "1.5jt sewa kos bca", note: "Keluar Rp 1.500.000 kategori Tagihan dari BCA" },
      ],
    },
    {
      title: "Pemasukan Cepat",
      badge: "Income",
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
      icon: ArrowUpRight,
      iconColor: "text-emerald-500",
      desc: "Awali dengan tanda + atau gunakan kata kunci pemasukan (gaji, bonus, thr, dll).",
      examples: [
        { text: "+5jt gaji bulanan bca", note: "Masuk Rp 5.000.000 kategori Gaji ke BCA" },
        { text: "+350k freelance desain mandiri", note: "Masuk Rp 350.000 kategori Freelance ke Mandiri" },
        { text: "+100rb angpao lebaran cash", note: "Masuk Rp 100.000 kategori Hadiah ke dompet Cash" },
      ],
    },
    {
      title: "Transfer Antar Kantong",
      badge: "Transfer",
      badgeColor: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-900",
      icon: ArrowRightLeft,
      iconColor: "text-sky-500",
      desc: "Gunakan awalan 'tf', 'transfer', atau 'pindah' dengan format asal 'ke' tujuan.",
      examples: [
        { text: "tf 100k bca ke gopay topup", note: "Pindah Rp 100.000 dari BCA ke Gopay catatan 'topup'" },
        { text: "transfer 500rb mandiri ke cash", note: "Pindah Rp 500.000 dari Mandiri ke Cash" },
        { text: "pindah 50k gopay ke ovo", note: "Pindah saldo Rp 50.000 dari Gopay ke OVO" },
      ],
    },
    {
      title: "Tarik Tunai ATM",
      badge: "Tarik Tunai",
      badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-900",
      icon: ArrowRightLeft,
      iconColor: "text-amber-500",
      desc: "Otomatis memindahkan saldo dari rekening bank pilihan ke kantong tunai/cash.",
      examples: [
        { text: "tarik tunai 500k mandiri", note: "Tarik Rp 500.000 dari Mandiri ke dompet Cash" },
        { text: "tarik 200rb bca", note: "Tarik Rp 200.000 dari BCA ke dompet Cash" },
      ],
    },
  ];

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                Panduan Smart Input
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Catat transaksi dalam 1 kalimat natural dengan auto-detect kategori & kantong
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list (Scrollable) */}
        <div className="overflow-y-auto py-4 space-y-5 pr-1 text-xs">
          {/* Quick tips alert */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200/70 dark:border-zinc-700/60 space-y-1.5 text-zinc-600 dark:text-zinc-300">
            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-600" /> Tips Format Nominal
            </div>
            <p className="text-[11px] leading-relaxed">
              Mendukung singkatan nominal: <span className="font-semibold text-zinc-800 dark:text-zinc-200">k</span> / <span className="font-semibold text-zinc-800 dark:text-zinc-200">rb</span> (ribu), <span className="font-semibold text-zinc-800 dark:text-zinc-200">jt</span> (juta). Contoh: <code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded text-[10px]">25k</code> = 25.000, <code className="bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded text-[10px]">1.5jt</code> = 1.500.000.
            </p>
          </div>

          {exampleSections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${sec.iconColor}`} />
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                      {sec.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sec.badgeColor}`}
                  >
                    {sec.badge}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {sec.desc}
                </p>

                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {sec.examples.map((ex, exIdx) => (
                    <button
                      key={exIdx}
                      type="button"
                      onClick={() => {
                        if (onSelectExample) {
                          onSelectExample(ex.text);
                        }
                      }}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 hover:bg-emerald-50/70 dark:bg-zinc-800/40 dark:hover:bg-emerald-950/30 border border-zinc-200/60 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800 text-left transition-all"
                      title="Klik untuk gunakan contoh ini"
                    >
                      <div className="space-y-0.5">
                        <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                          {ex.text}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {ex.note}
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0 ml-2 font-medium">
                        Gunakan ↵
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold h-9 px-4"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
