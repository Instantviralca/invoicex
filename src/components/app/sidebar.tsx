"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Users,
  FileStack,
} from "lucide-react";
import { LogoutButton } from "@/components/app/logout-button";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/invoices", label: "Invoices", icon: FileText },
  { href: "/app/quotes", label: "Quotes", icon: FileStack },
  { href: "/app/clients", label: "Clients", icon: Users },
  { href: "/app/products", label: "Products & Services", icon: Package },
  { href: "/app/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/app/reports", label: "Reports", icon: BarChart3 },
  { href: "/app/templates", label: "Templates", icon: FileText },
  { href: "/app/subscription", label: "Subscription", icon: CreditCard },
  { href: "/app/settings/profile", label: "Settings", icon: Settings },
  { href: "/app/help", label: "Help", icon: HelpCircle },
];

type SidebarProps = {
  workspaceName: string;
  className?: string;
};

export function Sidebar({ workspaceName, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-[#1a3a42] lg:bg-background-navy lg:text-foreground-on-dark lg:shadow-[inset_-1px_0_0_rgb(45_212_191/0.08)]",
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href="/app" className="flex items-center gap-2">
          <Logo className="h-7" variant="onDark" href={null} />
        </Link>
      </div>

      <div className="mx-4 mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
        <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-foreground-on-dark-muted">
          Workspace
        </p>
        <p className="truncate text-sm font-medium text-foreground-on-dark">
          {workspaceName}
        </p>
      </div>

      <div className="px-4 pt-4">
        <Button
          asChild
          className="w-full justify-start gap-2 bg-brand text-brand-foreground shadow-glow hover:bg-brand-hover"
          size="sm"
        >
          <Link href="/app/invoices/new">
            <Plus className="size-4" aria-hidden="true" />
            Create invoice
          </Link>
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Main navigation">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/app"
              ? pathname === "/app"
              : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "sidebar-active font-semibold"
                  : "text-foreground-on-dark-muted hover:bg-white/10 hover:text-foreground-on-dark",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0 opacity-90" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
