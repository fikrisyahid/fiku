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
import { getServerTheme } from "@/lib/theme/server";
import { THEME_COOKIE_NAME } from "@/lib/theme/types";
import { ThemeProvider } from "@/lib/theme/context";
import { InstallPwaBanner } from "@/components/install-pwa-banner";
import NextTopLoader from "nextjs-toploader";

export const metadata: Metadata = {
  title: "Fiku - Catat Keuangan Cerdas Tanpa Ribet",
  description: "Aplikasi pencatat transaksi harian, pengelolaan kantong dana, dan ringkasan keuangan personal.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fiku",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/fiku-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/brand/fiku-icon-192.png", sizes: "192x192" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  const theme = await getServerTheme();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )` + THEME_COOKIE_NAME + `=([^;]*)/);var t=m?decodeURIComponent(m[1]):"${theme}";var isDark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 dark:bg-gradient-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-zinc-900 dark:text-zinc-50">
        <ThemeProvider initialTheme={theme}>
          <NextTopLoader
            color="#10b981"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #10b981,0 0 5px #10b981"
            zIndex={99999}
          />
          <I18nProvider locale={locale}>
            {children}
            <InstallPwaBanner />
          </I18nProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  );
}
