import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { DocumentGeneratorDemo } from "@/components/marketing/document-generator-demo";
import { QuoteWorkflowVisual } from "@/components/marketing/product-compositions";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Quote Generator",
  description:
    "Create a quote preview in your browser with InvoiceX. Register free to save quotes, convert them to invoices, and download PDFs.",
  path: "/quote-generator",
});

const workflowSteps = [
  { label: "Draft your scope", detail: "Add line items and validity dates" },
  { label: "Send to client", detail: "Download PDF or email on paid plans" },
  { label: "Record acceptance", detail: "Mark the quote as accepted in your workspace" },
  { label: "Convert to invoice", detail: "Line items carry over automatically" },
] as const;

export default function QuoteGeneratorPage() {
  return (
    <>
      <section className="border-b border-border-soft py-12 sm:py-16">
        <Container size="wide">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
                Quote generator
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Prepare a quote preview for your client
              </h1>
              <p className="mt-4 text-base leading-relaxed text-foreground-muted">
                Outline scope and pricing before you commit to an invoice. This preview runs in
                your browser — create a free account to save quotes and convert accepted quotes to
                invoices.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/register">
                    Save quotes with a free account
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/features#invoices-quotes">Learn about quotes</Link>
                </Button>
              </div>

              <div className="mt-10 space-y-3">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className="flex items-start gap-4 rounded-xl border border-border-soft bg-background-elevated px-4 py-3"
                  >
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-muted text-xs font-bold text-brand-deep">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{step.label}</p>
                      <p className="text-sm text-foreground-muted">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-background-lavender via-background to-background-sky p-5 sm:p-6">
              <QuoteWorkflowVisual />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-background-muted/40 py-12 sm:py-20">
        <Container size="wide">
          <DocumentGeneratorDemo type="quote" />
        </Container>
      </section>

      <section className="border-t border-border-soft py-12 sm:py-14">
        <Container size="narrow">
          <div className="surface-card p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-foreground">
              From quote to invoice
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-foreground-muted">
              When your client accepts a quote, convert it to an invoice inside InvoiceX without
              re-entering line items. See our help article on{" "}
              <Link href="/help/quotes-conversion" className="font-medium text-brand hover:underline">
                converting quotes to invoices
              </Link>
              .
            </p>
          </div>
        </Container>
      </section>
    </>
  );
}
