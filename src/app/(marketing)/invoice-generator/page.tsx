import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { DocumentGeneratorDemo } from "@/components/marketing/document-generator-demo";
import { InvoicePaperPreview } from "@/components/marketing/product-compositions";
import { Button } from "@/components/ui/button";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Invoice Generator",
  description:
    "Try the free InvoiceX invoice preview tool — line items, VAT and layout in your browser before you register at invoicex.store.",
  path: "/invoice-generator",
});

const benefits = [
  "Save invoices and access them from any device",
  "Download professional PDFs with your business details",
  "Store clients and reuse them on future documents",
  "Track payment status and send emails on paid plans",
] as const;

export default function InvoiceGeneratorPage() {
  return (
    <>
      <section className="border-b border-border-soft bg-background-elevated/60 py-12 sm:py-16">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
                Invoice generator
              </p>
              <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Sketch a UK invoice before you sign up
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-foreground-muted">
                Add your business and client names, line items and VAT to see a realistic layout.
                Everything runs in your browser — nothing is saved until you open a free InvoiceX
                account.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/register">
                    Save invoices with a free account
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/pricing">View plans</Link>
                </Button>
              </div>
            </div>
            <div className="hidden rounded-2xl bg-gradient-to-br from-background-sky to-background-lavender p-5 lg:block">
              <InvoicePaperPreview template="classic" className="shadow-lg" />
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-20">
        <Container size="wide">
          <DocumentGeneratorDemo type="invoice" />
        </Container>
      </section>

      <section className="border-t border-border-soft bg-background-navy py-14 text-foreground-on-dark sm:py-16">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-2xl font-semibold">Why register?</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground-on-dark-muted">
                The preview above runs entirely in your browser. A free account unlocks saving,
                PDF export, and client management.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {benefits.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>
    </>
  );
}
