import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { brand, company } from "@/config/brand";
import { cn } from "@/lib/utils";

export type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type LegalDocumentProps = {
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalSection[];
  className?: string;
};

export function LegalDocument({
  title,
  description,
  lastUpdated,
  sections,
  className,
}: LegalDocumentProps) {
  return (
    <Container className={cn("py-12 lg:py-16", className)}>
      <div className="mx-auto max-w-6xl">
        <header className="max-w-2xl border-b border-border-soft pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
            Legal
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground-muted">
            {description}
          </p>
          <p className="mt-4 text-sm text-foreground-subtle">
            Last updated: {lastUpdated}
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 xl:grid-cols-[16rem_minmax(0,42rem)_14rem]">
          {/* Sticky TOC — desktop */}
          <nav
            aria-label="Table of contents"
            className="hidden lg:block"
          >
            <div className="sticky top-24 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
                Contents
              </p>
              <ol className="space-y-1 border-l border-border-soft pl-4 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block py-1 text-foreground-muted transition-colors hover:text-brand"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          {/* Main content — narrow reading width */}
          <div className="min-w-0">
            {/* Mobile TOC */}
            <nav
              aria-label="Table of contents"
              className="surface-card mb-8 p-4 lg:hidden"
            >
              <p className="text-sm font-semibold text-foreground">Contents</p>
              <ol className="mt-3 list-inside list-decimal space-y-1 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`} className="text-brand hover:underline">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="space-y-12">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {section.title}
                  </h2>
                  <div className="mt-4 max-w-prose space-y-4 text-sm leading-[1.75] text-foreground-muted [&_a]:font-medium [&_a]:text-brand [&_a]:hover:underline [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ul]:list-disc [&_ul]:space-y-2">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Company panel — desktop sidebar */}
          <aside className="hidden xl:block">
            <div className="sticky top-24 surface-card space-y-3 p-5 text-sm text-foreground-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground-subtle">
                Company details
              </p>
              <p className="font-semibold text-foreground">{company.legalName}</p>
              <p>Company number {company.companyNumber}</p>
              <p>{company.registeredJurisdiction}</p>
              <p>{company.registeredOfficeSingleLine}</p>
              <p>
                <a
                  href={`mailto:${brand.supportEmail}`}
                  className="font-medium text-brand hover:underline"
                >
                  {brand.supportEmail}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${brand.supportPhoneTel}`}
                  className="font-medium text-brand hover:underline"
                >
                  {brand.supportPhone}
                </a>
              </p>
              <hr className="border-border-soft" />
              <p className="text-xs leading-relaxed">
                Questions about this document?{" "}
                <Link href="/contact" className="font-medium text-brand hover:underline">
                  Contact us
                </Link>
                .
              </p>
            </div>
          </aside>
        </div>

        {/* Company panel — mobile/tablet */}
        <div className="mt-12 surface-card p-5 text-sm text-foreground-muted xl:hidden">
          <p className="font-semibold text-foreground">{company.legalName}</p>
          <p>Company number {company.companyNumber}</p>
          <p>{company.registeredOfficeSingleLine}</p>
          <p>
            <a
              href={`mailto:${brand.supportEmail}`}
              className="font-medium text-brand hover:underline"
            >
              {brand.supportEmail}
            </a>
          </p>
          <p>
            <a
              href={`tel:${brand.supportPhoneTel}`}
              className="font-medium text-brand hover:underline"
            >
              {brand.supportPhone}
            </a>
          </p>
        </div>
      </div>
    </Container>
  );
}
