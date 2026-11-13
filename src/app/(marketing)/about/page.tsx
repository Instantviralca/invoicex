import Link from "next/link";
import { Building2, FileText, Mail, Shield } from "lucide-react";
import { Container } from "@/components/marketing/container";
import {
  brand,
  company,
  serviceDisclaimer,
  subscriptionBillingClarity,
} from "@/config/brand";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "InvoiceX is UK invoice and quote software operated by THE HOUSE OF VEYNOR LTD from invoicex.store.",
  path: "/about",
});

const pillars = [
  {
    icon: FileText,
    title: "What we sell",
    content: (
      <>
        <p>
          We build subscription software for UK businesses that need reliable invoices and quotes
          without adopting a full accounting suite. Core features include client records, PDF
          downloads on every plan, and — on paid tiers — email delivery, recurring invoices,
          reports, and team access.
        </p>
        <p className="mt-4">
          {brand.productName} is sold only through {brand.domain}. Subscriptions are billed in GBP;
          checkout is handled by our payment partner and we do not store card numbers.
        </p>
        <p className="mt-4">{subscriptionBillingClarity}</p>
      </>
    ),
  },
  {
    icon: Shield,
    title: "Service disclaimer",
    content: <p>{serviceDisclaimer}</p>,
  },
  {
    icon: Mail,
    title: "Contact",
    content: (
      <p>
        For product support, billing questions, or general enquiries, email{" "}
        <a
          href={`mailto:${brand.supportEmail}`}
          className="font-medium text-brand hover:underline"
        >
          {brand.supportEmail}
        </a>
        , call{" "}
        <a
          href={`tel:${brand.supportPhoneTel}`}
          className="font-medium text-brand hover:underline"
        >
          {brand.supportPhone}
        </a>
        , or use our{" "}
        <Link href="/contact" className="font-medium text-brand hover:underline">
          contact form
        </Link>
        .
      </p>
    ),
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <section className="bg-background-navy py-16 text-foreground-on-dark sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                About
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                About {brand.productName}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-foreground-on-dark-muted">
                {brand.tagline}
              </p>
            </div>

            <div className="surface-card border-white/10 bg-white/5 p-6 text-foreground sm:p-8">
              <div className="flex items-start gap-3">
                <Building2 className="size-5 shrink-0 text-brand" aria-hidden />
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Who we are
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
                    {brand.productName} is operated by {company.legalName} (company number{" "}
                    {company.companyNumber}), registered in {company.registeredJurisdiction}.
                  </p>
                </div>
              </div>
              <dl className="mt-6 space-y-4 border-t border-border-soft pt-6 text-sm">
                <div>
                  <dt className="font-semibold text-foreground">Legal name</dt>
                  <dd className="mt-1 text-foreground-muted">{company.legalName}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Company number</dt>
                  <dd className="mt-1 text-foreground-muted">{company.companyNumber}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Registered jurisdiction</dt>
                  <dd className="mt-1 text-foreground-muted">
                    {company.registeredJurisdiction}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Registered office</dt>
                  <dd className="mt-1 text-foreground-muted">
                    {company.registeredOfficeMultiline.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="surface-card p-6 sm:p-7">
                <pillar.icon className="size-5 text-brand" aria-hidden />
                <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
                  {pillar.title}
                </h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground-muted">
                  {pillar.content}
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
