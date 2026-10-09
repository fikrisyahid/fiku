import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getUserSettings } from "@/app/actions/settings";
import { AppNavbar } from "@/components/app-navbar";
import { SettingsClient } from "@/components/settings-client";
import { getServerLocale, getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata() {
  const dict = await getServerDictionary();
  return {
    title: dict.settings.metaTitle,
    description: dict.settings.metaDesc,
  };
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const locale = await getServerLocale();
  const dict = await getServerDictionary();
  const settings = await getUserSettings(user.id);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-16 overflow-x-hidden">
      <AppNavbar user={user} locale={locale} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {dict.settings.heading}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {dict.settings.subheading}
          </p>
        </div>

        <SettingsClient
          userId={user.id}
          user={{
            fullName: user.fullName,
            email: user.email,
          }}
          initialCurrency={settings.currency || "IDR"}
        />
      </main>
    </div>
  );
}
