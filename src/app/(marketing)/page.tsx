import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  FileText,
  Laptop,
  Paintbrush,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { Container } from "@/components/marketing/container";
import { FaqSection, type FaqItem } from "@/components/marketing/faq-section";
import { HomepageJsonLd } from "@/components/marketing/json-ld";
import { PricingCards } from "@/components/marketing/pricing-cards";
import {
  DashboardPreviewCard,
  HeroProductComposition,
  InvoicePaperPreview,
  QuoteWorkflowVisual,
} from "@/components/marketing/product-compositions";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { brand, pricingNotes, serviceDisclaimer } from "@/config/brand";
import { marketing } from "@/config/marketing";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Online Invoice & Quote Generator for Small Businesses",
  description:
    "InvoiceX helps UK businesses create invoices and quotes, manage clients, download PDFs and track payment status — from invoicex.store.",
  path: "/",
});

const trustStrip = marketing.trustStrip.map((label) => ({ label }));

const journey = [
  {
    step: "01",
    title: "Build the document",
    description:
      "Pull in saved clients, add line items, VAT and payment terms, and set dates in an editor built for day-to-day billing — not spreadsheets.",
  },
  {
    step: "02",
    title: "Apply your branding",
    description:
      "Use your logo, accent colour and preferred template so every PDF looks like it came from your business.",
  },
  {
    step: "03",
    title: "Send or export",
    description:
      "Download a polished PDF on every plan. Paid plans can email documents directly from InvoiceX.",
  },
  {
    step: "04",
    title: "Track its status",
    description:
      "See draft, sent, due soon, overdue and paid at a glance — always based on the records you enter, not bank feeds.",
  },
] as const;

const invoiceCallouts = [
  "Logo and brand colour",
  "Automatic totals",
  "VAT control",
  "Payment terms",
  "PDF export",
  "Status tracking",
] as const;

const audiences = [
  {
    title: "Freelancers",
    description: "Turn finished work into a clear PDF invoice before the weekend.",
    icon: Laptop,
  },
  {
    title: "Consultants",
    description: "Scope projects with quotes, then convert accepted ones without retyping line items.",
    icon: Users,
  },
  {
    title: "Creative agencies",
    description: "Keep client branding consistent across Classic, Modern and Minimal templates.",
    icon: Paintbrush,
  },
  {
    title: "Contractors",
    description: "Record payment status and keep project paperwork organised in one place.",
    icon: Wrench,
  },
  {
    title: "Small service businesses",
    description: "Manage recurring clients, products and professional PDFs as you grow.",
    icon: Building2,
  },
] as const;

const faqItems: FaqItem[] = [
  {
    question: "Is the Free plan really free?",
    answer: (
      <p>
        Yes. The Free plan is £0 and does not require a card. Each month you can create
        up to three combined invoices and quotes, keep up to five active clients, and
        download PDFs using the Classic template from {brand.domain}.
      </p>
    ),
  },
  {
    question: "Who runs InvoiceX?",
    answer: (
      <p>
        {brand.productName} is operated by THE HOUSE OF VEYNOR LTD (company number
        17561169), registered in England.         For product or billing help, email{" "}
        <a
          href={`mailto:${brand.supportEmail}`}
          className="font-medium text-brand hover:underline"
        >
          {brand.supportEmail}
        </a>{" "}
        or call{" "}
        <a
          href={`tel:${brand.supportPhoneTel}`}
          className="font-medium text-brand hover:underline"
        >
          {brand.supportPhone}
        </a>
        .
      </p>
    ),
  },
  {
    question: "What do paid plans add?",
    answer: (
      <p>
        Paid plans increase document and client limits, unlock all templates,
        remove InvoiceX footer branding, and add features such as email
        delivery, CSV export, recurring invoices, reports, and team access on
        Business. See the{" "}
        <Link href="/pricing" className="font-medium text-brand hover:underline">
          pricing page
        </Link>{" "}
        for a full comparison.
      </p>
    ),
  },
  {
    question: "How do I cancel?",
    answer: (
      <p>
        Cancel online from your Subscription page at any time. Access continues
        until the end of the paid billing period. See our{" "}
        <Link
          href="/subscription-cancellation"
          className="font-medium text-brand hover:underline"
        >
          Subscription Cancellation Policy
        </Link>
        .
      </p>
    ),
  },
  {
    question: "Can I download PDFs?",
    answer: (
      <p>
        Yes. PDF download is available on all plans, including Free. On Free,
        send the file with your own email client; paid plans can email from the
        platform.
      </p>
    ),
  },
  {
    question: "How does VAT work?",
    answer: (
      <p>
        You can add VAT to line items and show VAT totals on documents. You remain
        responsible for the correct VAT treatment for your business. InvoiceX
        does not provide tax or accounting advice.
      </p>
    ),
  },
  {
    question: "Who owns my data?",
    answer: (
      <p>
        You retain ownership of the business and client information you enter. We
        process it to provide the service, as described in our{" "}
        <Link href="/privacy" className="font-medium text-brand hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
    ),
  },
  {
    question: "Can I email documents to clients?",
    answer: (
      <p>
        Email delivery from the platform is available on Starter, Pro and Business.
        On Free, download the PDF and send it yourself.
      </p>
    ),
  },
  {
    question: "Does InvoiceX provide tax advice?",
    answer: <p>{serviceDisclaimer}</p>,
  },
];

export default function HomePage() {
  return (
    <>
      <HomepageJsonLd />

      {/* Hero */}
      <section className="relative overflow-hidden marketing-mesh">
        <div className="pointer-events-none absolute inset-0 marketing-grid" aria-hidden />
        <Container size="wide" className="relative py-14 sm:py-20 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
            <div className="animate-fade-up max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-brand-muted bg-background-elevated/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-deep shadow-xs">
                <FileText className="size-3.5" aria-hidden />
                {marketing.heroEyebrow}
              </p>
              <h1 className="mt-5 font-display text-[2.15rem] font-semibold leading-[1.12] tracking-tight text-foreground sm:text-5xl sm:leading-[1.08]">
                {marketing.heroHeadline}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-foreground-muted sm:text-lg">
                {marketing.heroSubhead}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href="/register">
                    Start Free
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
              <ul className="mt-8 flex flex-col gap-2.5 text-sm text-foreground-muted sm:flex-row sm:flex-wrap sm:gap-x-5">
                {marketing.heroBullets.map((item) => (
                  <li key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <HeroProductComposition className="animate-fade-up" />
          </div>
        </Container>
      </section>

      {/* Trust strip */}
      <section className="border-y border-border-soft bg-background-elevated">
        <Container size="wide" className="py-5">
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {trustStrip.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground-muted"
              >
                <ShieldCheck className="size-4 text-brand" aria-hidden />
                {item.label}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Product journey */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="How InvoiceX works"
            title="From first line item to marked paid"
            description="A straight-line workflow you can explain to a client in one sentence."
          />
          <div className="mt-12 space-y-8">
            {journey.map((item, index) => (
              <div
                key={item.step}
                className={`grid items-center gap-8 rounded-2xl border border-border-soft bg-background-elevated p-6 shadow-sm lg:grid-cols-2 lg:gap-12 lg:p-10 ${
                  index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <p className="font-display text-sm font-semibold text-brand">
                    Step {item.step}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-foreground-muted">
                    {item.description}
                  </p>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-background-sky via-background to-background-lavender p-4 sm:p-6">
                  {index === 0 ? (
                    <InvoicePaperPreview template="classic" />
                  ) : index === 1 ? (
                    <InvoicePaperPreview template="modern" />
                  ) : index === 2 ? (
                    <InvoicePaperPreview template="minimal" />
                  ) : (
                    <DashboardPreviewCard />
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Invoice showcase */}
      <section className="border-y border-border-soft bg-background-navy py-16 text-foreground-on-dark sm:py-24">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                Invoice showcase
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                PDFs that look like your business, not a template dump
              </h2>
              <p className="mt-4 text-base leading-relaxed text-foreground-on-dark-muted">
                Your logo, colours, line items, VAT breakdown and payment instructions
                on every PDF — download on any plan, or email from the platform on paid
                plans.
              </p>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {invoiceCallouts.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                  >
                    <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <InvoicePaperPreview template="modern" className="shadow-xl" />
          </div>
        </Container>
      </section>

      {/* Quote workflow */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading
                align="left"
                eyebrow="Quotations"
                title="Draft, send, accept, convert"
                description="Send a quote, record when it is accepted, and spin up a matching invoice — the original quote stays in your history."
              />
              <Button asChild variant="outline" className="mt-8">
                <Link href="/quote-generator">Explore the quote workflow</Link>
              </Button>
            </div>
            <QuoteWorkflowVisual />
          </div>
        </Container>
      </section>

      {/* Dashboard demo */}
      <section className="border-y border-border-soft bg-background-muted/60 py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Workspace overview"
            title="See outstanding work at a glance"
            description="One screen for what you have invoiced, marked paid, still outstanding and overdue — totals come from your entries, not live bank data."
          />
          <div className="mx-auto mt-12 max-w-4xl">
            <DashboardPreviewCard />
          </div>
        </Container>
      </section>

      {/* Templates */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Templates"
            title="Classic, Modern and Minimal"
            description="Compare the same fictional invoice across three original layouts — so you can choose the look that fits your brand."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {(
              [
                { id: "classic" as const, name: "Classic", note: "Clean serif-friendly layout" },
                { id: "modern" as const, name: "Modern", note: "Bold brand colour header" },
                { id: "minimal" as const, name: "Minimal", note: "Quiet, typography-led" },
              ] as const
            ).map((tpl) => (
              <div key={tpl.id} className="surface-card surface-card-hover p-4">
                <InvoicePaperPreview template={tpl.id} />
                <div className="mt-4 px-1">
                  <h3 className="font-display text-lg font-semibold text-foreground">
                    {tpl.name}
                  </h3>
                  <p className="text-sm text-foreground-muted">{tpl.note}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button asChild variant="link">
              <Link href="/invoice-templates">View full template details</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* Audiences */}
      <section className="border-y border-border-soft bg-background-elevated py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Who it is for"
            title="Designed for UK freelancers and small teams"
            description="Practical document administration for people who bill for their work — not a bank, and not a full accounting suite."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {audiences.map((audience) => (
              <div
                key={audience.title}
                className="rounded-2xl border border-border-soft bg-background p-5 shadow-xs"
              >
                <audience.icon className="size-5 text-brand" aria-hidden />
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {audience.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Pricing */}
      <section className="py-16 sm:py-24">
        <Container>
          <SectionHeading
            eyebrow="Pricing"
            title="Straightforward UK pricing"
            description={pricingNotes.freePlan}
          />
          <div className="mt-12">
            <PricingCards compact showNotes={false} />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-foreground-muted">
            {pricingNotes.vatNote}{" "}
            <Link
              href="/subscription-cancellation"
              className="font-medium text-brand hover:underline"
            >
              Cancellation policy
            </Link>
            {" · "}
            <Link href="/refund-policy" className="font-medium text-brand hover:underline">
              Refund policy
            </Link>
          </p>
          <div className="mt-4 text-center">
            <Button asChild variant="link">
              <Link href="/pricing">Compare all plans and billing details</Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="border-t border-border-soft bg-background-muted/50 py-16 sm:py-24">
        <Container size="narrow">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions before you sign up"
            description="Billing, PDFs, VAT, your data, and what InvoiceX will not do for you."
          />
          <div className="mt-10">
            <FaqSection items={faqItems} />
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-12 text-center text-brand-foreground shadow-glow sm:px-12 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 20%, white, transparent 35%), radial-gradient(circle at 80% 0%, white, transparent 25%)",
              }}
              aria-hidden
            />
            <div className="relative">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {marketing.finalCtaTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-base text-brand-foreground/85">
                {marketing.finalCtaBody}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-brand hover:bg-white/95"
                >
                  <Link href="/register">Start Free</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="/how-it-works">See how it works</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-brand-foreground/75">
                No card required for the Free plan.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
