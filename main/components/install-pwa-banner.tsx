"use client";

import { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Smartphone, Check } from "lucide-react";
import { FikuLogo } from "@/components/fiku-logo";
import { useI18n } from "@/lib/i18n/context";

// LocalStorage keys
const DISMISS_KEY = "fiku_pwa_dismissed_until";
const INSTALLED_KEY = "fiku_pwa_installed";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPwaBanner() {
  const { dict } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIosModalOpen, setIsIosModalOpen] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed and opened as PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      // Never show in standalone mode
      localStorage.setItem(INSTALLED_KEY, "true");
      return;
    }

    // 2. Check if already marked as installed
    if (localStorage.getItem(INSTALLED_KEY) === "true") {
      return;
    }

    // 3. Check 1-day graceful dismissal
    const dismissedUntil = localStorage.getItem(DISMISS_KEY);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIosDevice(isIos);

    // Event listener for native Chromium prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 1.5 seconds after load so it feels natural and not intrusive
      setTimeout(() => {
        setIsVisible(true);
      }, 1500);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      localStorage.setItem(INSTALLED_KEY, "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // If it's iOS Safari and not standalone, show banner after brief delay
    if (isIos) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIosDevice) {
      setIsIosModalOpen(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback if prompt is unavailable
      setIsIosModalOpen(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(INSTALLED_KEY, "true");
        setIsVisible(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn("PWA prompt error:", err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Graceful dismissal for 1 day
    localStorage.setItem(DISMISS_KEY, (Date.now() + ONE_DAY_MS).toString());
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Floating Bottom Card */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl dark:shadow-2xl flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0">
                <FikuLogo size="sm" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {dict.pwa.bannerTitle}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    PWA
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {dict.pwa.bannerDesc}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label={dict.pwa.dismissBtn}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {dict.pwa.dismissBtn}
            </button>
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{dict.pwa.installBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Step-by-Step Guidance Modal */}
      {isIosModalOpen && (
        <div
          onClick={() => setIsIosModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom-6 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  {dict.pwa.iosTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsIosModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {dict.pwa.iosDesc}
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Share className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">1. </span>
                  {dict.pwa.iosStep1}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <PlusSquare className="w-3.5 h-3.5" />
                </div>
                <div className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">2. </span>
                  {dict.pwa.iosStep2}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsIosModalOpen(false);
                handleDismiss();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{dict.pwa.iosGotIt}</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
