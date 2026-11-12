import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  Database,
  FileText,
  Receipt,
  Rocket,
  Settings,
  Zap,
} from "lucide-react";
import { Container } from "@/components/marketing/container";
import { helpArticleMeta } from "@/lib/help-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Help Centre",
  description:
    "InvoiceX help articles: creating invoices, quotes, VAT, billing, exports, and account management.",
  path: "/help",
});

const categoryIcons: Record<string, typeof Rocket> = {
  "Getting started": Rocket,
  Documents: FileText,
  "Tax and compliance": Receipt,
  "Account setup": Settings,
  Advanced: Zap,
  Billing: CreditCard,
  Data: Database,
};

const categoryDescriptions: Record<string, string> = {
  "Getting started": "Set up your account and send your first document.",
  Documents: "Invoices, quotes, email delivery, and payment status.",
  "Tax and compliance": "VAT fields and what to check for your business.",
  "Account setup": "Business details, branding, and workspace settings.",
  Advanced: "Recurring invoices and power-user workflows.",
  Billing: "Plans, upgrades, and cancellation.",
  Data: "Exports, PDFs, and your records.",
};

export default function HelpPage() {
  const categories = [...new Set(helpArticleMeta.map((a) => a.category))];

  return (
    <>
      <section className="border-b border-border-soft bg-background-elevated/70 py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-brand-muted text-brand">
              <BookOpen className="size-6" aria-hidden />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Help Centre
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              How can we help?
            </h1>
            <p className="mt-4 text-base leading-relaxed text-foreground-muted">
              Practical guides for using InvoiceX. If you cannot find what you need, contact
              support.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-8 md:grid-cols-2">
            {categories.map((category) => {
              const Icon = categoryIcons[category] ?? BookOpen;
              const articles = helpArticleMeta.filter((a) => a.category === category);

              return (
                <section
                  key={category}
                  className="surface-card overflow-hidden"
                >
                  <div className="border-b border-border-soft bg-background-muted/40 px-5 py-4 sm:px-6">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
                        <Icon className="size-4.5" aria-hidden />
                      </span>
                      <div>
                        <h2 className="font-display text-lg font-semibold text-foreground">
                          {category}
                        </h2>
                        {categoryDescriptions[category] ? (
                          <p className="mt-1 text-sm text-foreground-muted">
                            {categoryDescriptions[category]}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <ul className="divide-y divide-border-soft">
                    {articles.map((article) => (
                      <li key={article.slug}>
                        <Link
                          href={`/help/${article.slug}`}
                          className="group block px-5 py-4 transition-colors hover:bg-background-muted/50 sm:px-6"
                        >
                          <p className="font-medium text-foreground group-hover:text-brand">
                            {article.title}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                            {article.description}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <p className="mt-12 text-center text-sm text-foreground-muted">
            Still need help?{" "}
            <Link href="/contact" className="font-medium text-brand hover:underline">
              Contact support
            </Link>
            .
          </p>
        </Container>
      </section>
    </>
  );
}
