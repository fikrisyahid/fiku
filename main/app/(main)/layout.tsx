import { getCurrentUser } from "@/app/actions/auth";
import { getServerLocale } from "@/lib/i18n/server";
import { AppNavbar } from "@/components/app-navbar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, locale] = await Promise.all([
    getCurrentUser(),
    getServerLocale(),
  ]);

  return (
    <>
      <AppNavbar user={user} locale={locale} />
      <div className="pb-16 md:pb-0">
        {children}
      </div>
      <MobileBottomNav locale={locale} />
    </>
  );
}
