"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileStack,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/app/logout-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

type MobileNavProps = {
  workspaceName: string;
};

export function MobileNav({ workspaceName }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border-soft bg-background/90 px-4 backdrop-blur-md lg:hidden">
      <Link href="/app" aria-label="InvoiceX home">
        <Logo className="h-6" />
      </Link>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open navigation menu">
            <Menu className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-72 border-border-soft bg-background-navy p-0 text-foreground-on-dark"
        >
          <SheetHeader className="border-b border-white/10 px-4 py-4 text-left">
            <Logo className="mb-3 h-6" variant="onDark" href={null} />
            <SheetTitle className="font-ui text-sm font-normal text-foreground-on-dark-muted">
              {workspaceName}
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 py-3">
            <Button
              asChild
              className="w-full justify-start gap-2 bg-brand text-brand-foreground hover:bg-brand-hover"
              size="sm"
            >
              <Link href="/app/invoices/new">
                <Plus className="size-4" aria-hidden="true" />
                Create invoice
              </Link>
            </Button>
          </div>

          <nav className="flex flex-col gap-0.5 px-2 pb-4" aria-label="Mobile navigation">
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
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                    active
                      ? "sidebar-active font-semibold"
                      : "text-foreground-on-dark-muted hover:bg-white/10 hover:text-foreground-on-dark",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-90" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
            <div className="mt-4 border-t border-white/10 px-1 pt-4">
              <LogoutButton variant="button" className="w-full" />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
