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

export const metadata: Metadata = {
  title: "Fiku - Catat Keuangan Cerdas Tanpa Ribet",
  description: "Aplikasi pencatat transaksi harian, pengelolaan kantong dana, dan ringkasan keuangan personal.",
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
        theme === "dark" && "dark",
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
      <body className="min-h-full flex flex-col">
        <ThemeProvider initialTheme={theme}>
          <I18nProvider locale={locale}>
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
