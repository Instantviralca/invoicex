"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app/settings/profile", label: "Profile" },
  { href: "/app/settings/security", label: "Security" },
  { href: "/app/settings/business", label: "Business" },
  { href: "/app/settings/numbering", label: "Numbering" },
  { href: "/app/settings/tax", label: "Tax & VAT" },
  { href: "/app/settings/branding", label: "Branding" },
  { href: "/app/settings/team", label: "Team" },
  { href: "/app/settings/data", label: "Data export" },
  { href: "/app/settings/delete-account", label: "Delete account" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-56 lg:flex-col"
      aria-label="Settings"
    >
      <div className="surface-card hidden p-2 lg:block">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-foreground-subtle">
          Settings
        </p>
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "sidebar-active font-semibold"
                  : "text-foreground-muted hover:bg-background-muted hover:text-foreground",
                link.href.includes("delete-account") &&
                  !active &&
                  "text-destructive/80 hover:text-destructive",
              )}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex gap-1 lg:hidden">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-brand-muted bg-brand-muted text-brand-deep"
                  : "border-border-soft bg-card text-foreground-muted hover:border-border hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <Link
        href="/app/subscription"
        className="mt-2 hidden items-center gap-1 rounded-lg border border-border-soft bg-background-sky/50 px-3 py-2.5 text-sm font-medium text-brand hover:bg-background-sky lg:flex"
      >
        Subscription
        <span aria-hidden="true">→</span>
      </Link>
    </nav>
  );
}
