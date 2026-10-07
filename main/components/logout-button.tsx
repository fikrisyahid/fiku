"use client";

import { useState } from "react";
import { logoutUser } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    await logoutUser();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border-zinc-200 dark:border-zinc-800"
    >
      <LogOut className="w-3.5 h-3.5 mr-1" />
      {loading ? "Keluar..." : "Keluar"}
    </Button>
  );
}
