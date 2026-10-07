"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithPin } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage("Silakan masukkan username Telegram kamu.");
      return;
    }

    if (!pin.trim() || pin.trim().length !== 6) {
      setErrorMessage("Masukkan 6 digit PIN keamanan dengan benar.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await loginWithPin(username, pin);
      if (res.success) {
        setSuccessMessage("Login berhasil! Mengalihkan ke dashboard...");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 600);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 shadow-inner">
          <KeyRound className="w-6 h-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Masuk ke Fana Web
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
          Masukkan username Telegram dan 6 digit PIN keamanan akunmu
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && !errorMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
            <div className="leading-relaxed">{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="username"
              className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
            >
              Username Telegram
            </Label>
            <div className="relative">
              <Input
                id="username"
                type="text"
                placeholder="misal: @fikrisyahid14"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
                className="pr-10 h-11 text-sm bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-semibold text-xs">
                TG
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="pin"
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
              >
                PIN Keamanan (6 Digit)
              </Label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
              >
                {showPin ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Sembunyikan
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Tampilkan
                  </>
                )}
              </button>
            </div>
            <Input
              id="pin"
              type={showPin ? "text" : "password"}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="••••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
              disabled={loading}
              className="h-11 text-center text-xl font-mono tracking-[0.4em] font-bold bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              💡 Belum punya PIN? Buka bot Telegram dan ketik <code className="bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">/set_pin &lt;6_digit&gt;</code>
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || !username.trim() || pin.length !== 6}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Memverifikasi PIN...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                Masuk ke Dashboard <ShieldCheck className="w-4 h-4" />
              </span>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col border-t border-zinc-100 dark:border-zinc-800/80 pt-3 pb-3 text-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Belum pernah mengaktifkan Fana?{" "}
          <a
            href="https://t.me/fanadev_bot"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-0.5"
          >
            Buka Bot Telegram <ExternalLink className="w-3 h-3 ml-0.5" />
          </a>
        </p>
      </CardFooter>
    </Card>
  );
}
