import { getCurrentUser } from "@/app/actions/auth";
import { getServerLocale } from "@/lib/i18n/server";
import { AppNavbar } from "@/components/app-navbar";

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
      {children}
    </>
  );
}
