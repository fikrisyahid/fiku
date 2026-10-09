import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getServerLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/context";

export const metadata: Metadata = {
  title: "Fiku - Catat Keuangan Cerdas Tanpa Ribet",
  description: "Aplikasi pencatat transaksi harian, pengelolaan kantong dana, dan ringkasan keuangan personal.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale}
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
