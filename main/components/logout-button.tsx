"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { logoutUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { LogOut, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

export function LogoutButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !loading) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading]);

  async function handleLogout() {
    setLoading(true);
    await logoutUser();
    router.push("/login");
    router.refresh();
  }

  const modalContent = isOpen ? (
    <div
      onClick={() => !loading && setIsOpen(false)}
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 space-y-4 m-auto"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">
              Konfirmasi Keluar
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Apakah kamu yakin ingin keluar dari akun Fana? Sesi aktif di perangkat ini akan diakhiri.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => setIsOpen(false)}
            className="text-xs font-semibold rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer"
          >
            Batal
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleLogout}
            className="text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
            )}
            {loading ? "Keluar..." : "Ya, Keluar"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border-zinc-200 dark:border-zinc-800 cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5 mr-1" />
        Keluar
      </Button>

      {mounted && typeof document !== "undefined" && modalContent
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
}
