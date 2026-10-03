"use client";

import { useState } from "react";
import { submitWebOnboarding, OnboardingResult } from "@/app/actions/onboarding";
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

export function OnboardingForm() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const res = await submitWebOnboarding(formData);
    setResult(res);
    setLoading(false);
  }

  if (result?.success && result.user && result.account) {
    const formattedBalance = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(result.account.balance));

    return (
      <Card className="w-full max-w-lg shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-2xl mb-2">
            🎉
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Onboarding Berhasil!
          </CardTitle>
          <CardDescription>
            Akun keuangan kamu telah aktif dan siap digunakan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium">
              Profil Pengguna
            </div>
            <div className="text-base font-semibold">{result.user.fullName}</div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {result.user.email}
              {result.user.phone ? ` • ${result.user.phone}` : ""}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
            <div className="text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">
              Dompet Keuangan Siap Pakai
            </div>
            <div className="space-y-1.5">
              {(result.accounts || [result.account]).map((acc) => (
                <div key={acc.id} className="flex justify-between items-center text-sm py-1 border-b border-emerald-100 dark:border-emerald-900/40 last:border-none">
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{acc.name}</span>
                    <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 capitalize">{acc.type}</span>
                  </div>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(acc.balance))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1">
            <div className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1.5">
              <span>🤖</span> Terhubung ke Telegram
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Langkah berikutnya: Hubungkan akun ini dengan Telegram bot{" "}
              <a
                href="https://t.me/fanadev_bot"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold"
              >
                @fanadev_bot
              </a>{" "}
              untuk mencatat pengeluaran langsung dari chat!
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <Button
            variant="outline"
            onClick={() => setResult(null)}
            className="w-full"
          >
            Ubah / Buat Akun Baru
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-lg border-zinc-200 dark:border-zinc-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <div>
            <CardTitle className="text-xl font-bold">Onboarding Akun Keuangan</CardTitle>
            <CardDescription>
              Mulai atur keuanganmu lebih rapi dan terhubung ke Telegram bot.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {result && !result.success && (
            <div className="p-3 text-sm rounded-lg bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900">
              {result.message}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nama Lengkap *</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Contoh: Muhammad Fikri"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Nomor WhatsApp / HP (Opsional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="081234567890"
            />
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
              Pengaturan Dompet Pertama
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1.5">
                <Label htmlFor="walletName">Nama Dompet</Label>
                <Input
                  id="walletName"
                  name="walletName"
                  defaultValue="Cash (Dompet)"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="walletType">Tipe Dompet</Label>
                <select
                  id="walletType"
                  name="walletType"
                  defaultValue="cash"
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="cash" className="dark:bg-zinc-900">Cash / Tunai</option>
                  <option value="bank" className="dark:bg-zinc-900">Bank (BCA/Mandiri/dll)</option>
                  <option value="ewallet" className="dark:bg-zinc-900">e-Wallet (GoPay/OVO/dll)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="initialBalance">Saldo Awal (Rp)</Label>
              <Input
                id="initialBalance"
                name="initialBalance"
                type="number"
                defaultValue="0"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2 pb-6">
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Menyimpan..." : "Selesaikan Onboarding"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
