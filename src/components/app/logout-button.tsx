"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  variant?: "sidebar" | "button";
  className?: string;
};

export function LogoutButton({ variant = "sidebar", className }: LogoutButtonProps) {
  if (variant === "button") {
    return (
      <Button
        type="button"
        variant="outline"
        className={className}
        onClick={() => signOut({ callbackUrl: "/login" })}
      >
        Log out
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-muted hover:text-foreground",
        className,
      )}
    >
      <LogOut className="size-4" aria-hidden="true" />
      Log out
    </button>
  );
}
