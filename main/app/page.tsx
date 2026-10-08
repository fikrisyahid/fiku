import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  redirect("/transaksi");
}
