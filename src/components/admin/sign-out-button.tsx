"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AdminSignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={() => void signOut()}>
      Sign out
    </Button>
  );
}
