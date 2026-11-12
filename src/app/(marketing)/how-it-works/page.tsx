import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { HeroProductComposition } from "@/components/marketing/product-compositions";
import { WorkflowSteps } from "@/components/marketing/workflow-steps";
import { Button } from "@/components/ui/button";
import { brand } from "@/config/brand";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "How It Works",
  description:
    "Learn how InvoiceX works: set up your business, add clients, create documents, send PDFs, track payments, and manage recurring billing.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border-soft py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-50" aria-hidden />
        <Container className="relative">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
                How it works
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Six steps from sign-up to getting paid
              </h1>
              <p className="mt-5 text-base leading-relaxed text-foreground-muted sm:text-lg">
                {brand.productName} follows a simple UK billing workflow. No accounting package
                required — just your business profile, client details, and the work you are
                charging for.
              </p>
            </div>
            <HeroProductComposition className="hidden sm:block" />
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container size="wide">
          <WorkflowSteps />
        </Container>
      </section>

      <section className="border-y border-border-soft bg-background-elevated py-16 sm:py-20">
        <Container>
          <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                What you need before you start
              </h2>
              <p className="mt-3 text-sm text-foreground-muted">
                Gather these details once — they appear on every document you create.
              </p>
            </div>
            <ul className="space-y-3">
              {[
                "Your business or trading name and address",
                "Bank details or payment instructions to show on invoices",
                "Client name and billing address for the first document",
                "Line items with descriptions and prices",
                "Your VAT registration number, if you are VAT registered (you remain responsible for correct VAT treatment)",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-xl border border-border-soft bg-background px-4 py-3 text-sm leading-relaxed text-foreground-muted"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link href="/register">Create your free account</Link>
            </Button>
          </div>
        </Container>
      </section>

      <section className="pb-16 sm:pb-24">
        <Container className="pt-16">
          <CtaBand
            title="Try the workflow yourself"
            description="Register free and create your first invoice in minutes."
            primaryLabel="Start free"
            primaryHref="/register"
            secondaryLabel="Browse help articles"
            secondaryHref="/help"
            className="border-brand/20 bg-background-elevated shadow-md"
          />
        </Container>
      </section>
    </>
  );
}
