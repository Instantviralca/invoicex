import Link from "next/link";
import {
  BarChart3,
  Download,
  FileText,
  Layers,
  Mail,
  Package,
  RefreshCw,
  Table,
  Users,
} from "lucide-react";
import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import {
  DashboardPreviewCard,
  InvoicePaperPreview,
  QuoteWorkflowVisual,
} from "@/components/marketing/product-compositions";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { brand, plans } from "@/config/brand";
import { createPageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: "Features",
  description:
    "Explore InvoiceX features: invoices, quotes, clients, PDFs, email delivery, recurring billing, reports, templates, and team collaboration.",
  path: "/features",
});

const sections = [
  {
    id: "invoices-quotes",
    title: "Invoices and quotes",
    planNote: "All plans",
    icon: FileText,
    tone: "sky" as const,
    visual: "quote-workflow" as const,
    content: [
      "Create invoices and quotes with line items, quantities, unit prices, and optional VAT.",
      "Assign document numbers automatically and set issue and due dates.",
      "Download PDF copies on every plan.",
      "Convert accepted quotes into invoices without re-entering line items.",
      "Track document status from draft through to paid or declined.",
    ],
  },
  {
    id: "clients",
    title: "Client management",
    planNote: `Free: up to ${plans.free.limits.activeClients} active clients; paid plans offer higher or unlimited reasonable-use limits`,
    icon: Users,
    tone: "lavender" as const,
    visual: "dashboard" as const,
    content: [
      "Store client names, billing addresses, and contact details in one workspace.",
      "Link clients to invoices and quotes for consistent records.",
      "On Business, share client management across workspace members.",
    ],
  },
  {
    id: "pdfs",
    title: "PDF downloads",
    planNote: "All plans",
    icon: Download,
    tone: "neutral" as const,
    visual: "invoice-classic" as const,
    content: [
      "Generate PDF documents that reflect your chosen template and business profile.",
      "Download and archive PDFs for your records or send them via your own email on the Free plan.",
      "Paid plans can remove InvoiceX footer branding from documents.",
    ],
  },
  {
    id: "email",
    title: "Email delivery",
    planNote: "Starter, Pro, and Business",
    icon: Mail,
    tone: "brand" as const,
    visual: "invoice-modern" as const,
    content: [
      "Send invoices and quotes to clients directly from InvoiceX.",
      "Messages include your business details on the attached or linked document.",
      "Reduces the steps between finishing a document and getting it to your client.",
    ],
  },
  {
    id: "templates",
    title: "Document templates",
    planNote: "Classic on Free; Classic, Modern, and Minimal on paid plans",
    icon: Layers,
    tone: "lavender" as const,
    visual: "templates-trio" as const,
    content: [
      "Choose a layout that suits your brand: Classic for traditional invoices, Modern for a contemporary look, or Minimal for clean simplicity.",
      "Pro and Business plans support custom document colours.",
      "See template examples on the invoice templates page.",
    ],
  },
  {
    id: "recurring",
    title: "Recurring invoices",
    planNote: "Pro and Business",
    icon: RefreshCw,
    tone: "sky" as const,
    visual: "dashboard" as const,
    content: [
      "Set up invoices that generate on a schedule for retainers and repeat work.",
      "Automatic reminders notify clients when payment is due.",
      "Review generated invoices to confirm amounts before they are sent.",
    ],
  },
  {
    id: "reports",
    title: "Reports",
    planNote: "Pro and Business",
    icon: BarChart3,
    tone: "navy" as const,
    visual: "dashboard" as const,
    content: [
      "View summaries of invoiced amounts, outstanding balances, and document activity.",
      "Use reports to understand cash flow at a glance without exporting to a spreadsheet first.",
      "Export underlying data via CSV on paid plans that include CSV export.",
    ],
  },
  {
    id: "catalogue",
    title: "Products and services catalogue",
    planNote: "Pro and Business",
    icon: Package,
    tone: "neutral" as const,
    visual: "invoice-minimal" as const,
    content: [
      "Save frequently used products and services with default prices and descriptions.",
      "Add catalogue items to new documents quickly instead of typing details each time.",
    ],
  },
  {
    id: "team",
    title: "Team collaboration",
    planNote: "Business",
    icon: Users,
    tone: "brand" as const,
    visual: "dashboard" as const,
    content: [
      "Invite up to five workspace members with role-based access.",
      "Maintain up to three business profiles within one workspace.",
      "View an activity log of changes made by team members.",
    ],
  },
  {
    id: "exports",
    title: "CSV export",
    planNote: "Starter, Pro, and Business",
    icon: Table,
    tone: "sky" as const,
    visual: "invoice-classic" as const,
    content: [
      "Export document and client data for your own records or downstream tools.",
      "Complements PDF downloads with structured data you can analyse elsewhere.",
    ],
  },
] as const;

const toneClasses = {
  sky: "from-background-sky/80 to-background",
  lavender: "from-background-lavender/80 to-background",
  neutral: "from-background-muted/60 to-background",
  brand: "from-brand-muted/40 to-background",
  navy: "from-background-navy/5 to-background",
} as const;

function FeatureVisual({ type }: { type: (typeof sections)[number]["visual"] }) {
  switch (type) {
    case "quote-workflow":
      return <QuoteWorkflowVisual />;
    case "dashboard":
      return <DashboardPreviewCard />;
    case "invoice-classic":
      return <InvoicePaperPreview template="classic" />;
    case "invoice-modern":
      return <InvoicePaperPreview template="modern" />;
    case "invoice-minimal":
      return <InvoicePaperPreview template="minimal" />;
    case "templates-trio":
      return <InvoicePaperPreview template="modern" />;
  }
}

export default function FeaturesPage() {
  return (
    <>
      {/* Hero — full-width navy band */}
      <section className="relative overflow-hidden bg-background-navy py-16 text-foreground-on-dark sm:py-24">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 60% 50% at 80% 20%, rgb(47 91 234 / 0.4), transparent 60%)",
          }}
          aria-hidden
        />
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">
                Features
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                What {brand.productName} does today
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-foreground-on-dark-muted sm:text-lg">
                Everything below ships in the product today — from PDF invoices on the Free plan
                to recurring billing and team seats on Business. Plan limits are noted beside each
                section.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-brand hover:bg-brand-hover">
                  <Link href="/register">Start free</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  <Link href="/pricing">Compare plans</Link>
                </Button>
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm sm:p-6">
              <DashboardPreviewCard />
            </div>
          </div>
        </Container>
      </section>

      {/* Feature sections — alternating split layouts */}
      <section className="py-16 sm:py-24">
        <Container>
          <div className="space-y-20 sm:space-y-28">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const reversed = index % 2 === 1;

              return (
                <article
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                >
                  <div className={cn(reversed && "lg:order-2")}>
                    <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-background-elevated px-3 py-1 text-xs font-semibold text-brand-deep shadow-xs">
                      <Icon className="size-3.5" aria-hidden />
                      {section.planNote}
                    </div>
                    <h2 className="mt-4 font-display text-2xl font-semibold text-foreground sm:text-3xl">
                      {section.title}
                    </h2>
                    <ul className="mt-5 space-y-3">
                      {section.content.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-relaxed text-foreground-muted sm:text-base"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={cn(
                      "rounded-2xl bg-gradient-to-br p-4 sm:p-6",
                      toneClasses[section.tone],
                      reversed && "lg:order-1",
                    )}
                  >
                    <FeatureVisual type={section.visual} />
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-20 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/register">Start free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">Compare plans</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/invoice-templates">View templates</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="border-t border-border-soft bg-background-muted/40 pb-16 sm:pb-24">
        <Container className="pt-16">
          <CtaBand
            title="See features in action"
            description="Create your first invoice in minutes on the Free plan."
            primaryLabel="Start free"
            primaryHref="/register"
            secondaryLabel="How it works"
            secondaryHref="/how-it-works"
            className="border-brand/20 bg-background-elevated shadow-md"
          />
        </Container>
      </section>
    </>
  );
}
