"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const primaryLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Invoice Generator", href: "/invoice-generator" },
  { label: "Quote Generator", href: "/quote-generator" },
  { label: "Templates", href: "/invoice-templates" },
  { label: "Pricing", href: "/pricing" },
] as const;

const resourceLinks = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Help Centre", href: "/help" },
  { label: "Security", href: "/security" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

type SiteHeaderProps = {
  className?: string;
};

export function SiteHeader({ className }: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-transparent transition-[background,box-shadow,border-color] duration-200",
        scrolled ? "nav-scrolled" : "bg-transparent",
        className,
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-[80rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo size="sm" />

        <nav
          className="hidden items-center gap-0.5 xl:flex"
          aria-label="Main navigation"
        >
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-elevated hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}

          <div className="relative">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-elevated hover:text-foreground"
              aria-expanded={resourcesOpen}
              aria-haspopup="true"
              onClick={() => setResourcesOpen((v) => !v)}
              onBlur={(e) => {
                if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                  setResourcesOpen(false);
                }
              }}
            >
              Resources
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  resourcesOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {resourcesOpen ? (
              <div
                className="absolute left-0 top-full z-50 mt-1 min-w-[14rem] rounded-xl border border-border-soft bg-background-elevated p-2 shadow-lg"
                role="menu"
              >
                {resourceLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    className="block rounded-lg px-3 py-2 text-sm text-foreground-muted hover:bg-background-muted hover:text-foreground"
                    onClick={() => setResourcesOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="hidden items-center gap-2 xl:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/register">Start Free</Link>
          </Button>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="xl:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full border-l border-border-soft bg-background sm:max-w-sm">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo href={null} size="sm" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile navigation">
              {[...primaryLinks, ...resourceLinks].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-background-muted"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6">
              <Button asChild variant="outline">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  Log in
                </Link>
              </Button>
              <Button asChild>
                <Link href="/register" onClick={() => setMobileOpen(false)}>
                  Start Free
                </Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
