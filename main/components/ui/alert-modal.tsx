"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ModalAlertConfig {
  isOpen: boolean;
  title?: string;
  message: string;
  variant?: "error" | "warning" | "info" | "success";
}

interface AlertModalProps {
  config: ModalAlertConfig;
  onClose: () => void;
}

export function AlertModal({ config, onClose }: AlertModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && config.isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [config.isOpen, onClose]);

  if (!config.isOpen || !mounted) return null;

  const variant = config.variant || "error";

  const icon =
    variant === "error" ? (
      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
        <AlertCircle className="w-5 h-5" />
      </div>
    ) : variant === "warning" ? (
      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
    ) : variant === "success" ? (
      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
        <CheckCircle2 className="w-5 h-5" />
      </div>
    ) : (
      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
        <Info className="w-5 h-5" />
      </div>
    );

  const defaultTitle =
    variant === "error"
      ? "Gagal / Terjadi Kesalahan"
      : variant === "warning"
      ? "Peringatan"
      : variant === "success"
      ? "Berhasil"
      : "Informasi";

  const modalContent = (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 space-y-4 m-auto"
      >
        <div className="flex items-start gap-3.5">
          {icon}
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50 leading-tight">
              {config.title || defaultTitle}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed break-words whitespace-pre-wrap">
              {config.message}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end pt-2">
          <Button
            type="button"
            size="sm"
            onClick={onClose}
            className={`text-xs font-semibold rounded-xl text-white shadow-xs px-4 ${
              variant === "error"
                ? "bg-rose-600 hover:bg-rose-700"
                : variant === "warning"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
