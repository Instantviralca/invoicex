"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/marketing/container";
import { brand, company, serviceDisclaimer } from "@/config/brand";
import { cn } from "@/lib/utils";

const footerLinks = {
  product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Invoice Generator", href: "/invoice-generator" },
    { label: "Quote Generator", href: "/quote-generator" },
    { label: "Templates", href: "/invoice-templates" },
  ],
  company: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "Security", href: "/security" },
  ],
  support: [
    { label: "Help Centre", href: "/help" },
    { label: "Email support", href: `mailto:${brand.supportEmail}` },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Refund Policy", href: "/refund-policy" },
    { label: "Cancellation", href: "/subscription-cancellation" },
    { label: "Cookie Policy", href: "/cookie-policy" },
    { label: "Acceptable Use", href: "/acceptable-use" },
  ],
} as const;

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border-soft bg-background-navy text-foreground-on-dark",
        className,
      )}
    >
      <Container className="py-14 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo size="sm" variant="onDark" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground-on-dark-muted">
              {brand.tagline}
            </p>
            <p className="mt-6 text-xs leading-relaxed text-foreground-on-dark-muted">
              {serviceDisclaimer}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4 lg:col-span-8">
            <FooterColumn title="Product" links={footerLinks.product} />
            <FooterColumn title="Company" links={footerLinks.company} />
            <FooterColumn title="Support" links={footerLinks.support} />
            <FooterColumn title="Legal" links={footerLinks.legal} />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-white/10 pt-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1 text-sm text-foreground-on-dark-muted">
            <p className="font-medium text-foreground-on-dark">
              {company.legalName} · Company number {company.companyNumber}
            </p>
            <p>Registered in {company.registeredJurisdiction}</p>
            <p>{company.registeredOfficeSingleLine}</p>
            <p>
              <a
                href={`mailto:${brand.supportEmail}`}
                className="text-brand-muted hover:underline"
              >
                {brand.supportEmail}
              </a>
            </p>
            <p>
              <a
                href={`tel:${brand.supportPhoneTel}`}
                className="text-brand-muted hover:underline"
              >
                {brand.supportPhone}
              </a>
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 text-sm text-foreground-on-dark-muted lg:items-end">
            <button
              type="button"
              className="rounded-md text-left underline-offset-4 hover:text-foreground-on-dark hover:underline"
              onClick={() => {
                window.dispatchEvent(new Event("open-cookie-preferences"));
              }}
            >
              Cookie preferences
            </button>
            <p>
              © {year} {company.legalName}. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-on-dark">
        {title}
      </p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-foreground-on-dark-muted transition-colors hover:text-foreground-on-dark"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
