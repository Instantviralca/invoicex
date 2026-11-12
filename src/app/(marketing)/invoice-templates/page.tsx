import Link from "next/link";
import { Container } from "@/components/marketing/container";
import { InvoicePaperPreview } from "@/components/marketing/product-compositions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { plans } from "@/config/brand";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Invoice Templates",
  description:
    "Choose Classic, Modern, or Minimal invoice and quote templates in InvoiceX. Classic on Free; all templates on paid plans.",
  path: "/invoice-templates",
});

const templates = [
  {
    id: "classic" as const,
    name: "Classic",
    availability: "Free and paid plans",
    description:
      "A traditional layout with clear sections for your business details, client information, line items, and totals. Suitable for most trades and professional services where clarity matters more than visual flair.",
    traits: [
      "Structured header with business and client blocks",
      "Tabular line items with quantity and unit price columns",
      "Prominent totals and VAT breakdown",
      "InvoiceX footer branding on Free; removable on paid plans",
    ],
  },
  {
    id: "modern" as const,
    name: "Modern",
    availability: "Starter, Pro, and Business",
    description:
      "A contemporary design with balanced whitespace and refined typography. Works well for creative agencies, consultants, and businesses that want documents to feel current without being informal.",
    traits: [
      "Cleaner visual hierarchy with subtle dividers",
      "Comfortable spacing for longer line-item lists",
      "Professional tone suitable for email delivery",
      "Custom document colours on Pro and Business",
    ],
  },
  {
    id: "minimal" as const,
    name: "Minimal",
    availability: "Starter, Pro, and Business",
    description:
      "A stripped-back layout that prioritises essential information. Ideal when you prefer documents that get straight to the point — useful for repeat clients who already know your terms.",
    traits: [
      "Reduced visual noise with focus on figures",
      "Compact header area",
      "Easy to scan on screen and in print",
      "Custom document colours on Pro and Business",
    ],
  },
] as const;

export default function InvoiceTemplatesPage() {
  return (
    <>
      <section className="border-b border-border-soft py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Templates
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Three templates for invoices and quotes
            </h1>
            <p className="mt-5 text-base leading-relaxed text-foreground-muted sm:text-lg">
              The Free plan includes the {plans.free.limits.templates.join(", ")} template. Paid
              plans unlock Modern and Minimal, with custom colours on Pro and Business.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container>
          <div className="space-y-24 sm:space-y-32">
            {templates.map((template, index) => {
              const reversed = index % 2 === 1;

              return (
                <article
                  key={template.id}
                  id={template.id}
                  className="scroll-mt-24 grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                >
                  <div className={reversed ? "lg:order-2" : "lg:order-1"}>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                        {template.name}
                      </h2>
                      <Badge variant="secondary">{template.availability}</Badge>
                    </div>
                    <p className="mt-4 text-base leading-relaxed text-foreground-muted">
                      {template.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {template.traits.map((trait) => (
                        <li
                          key={trait}
                          className="flex gap-3 text-sm leading-relaxed text-foreground-muted"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                          {trait}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={reversed ? "lg:order-1" : "lg:order-2"}>
                    <div className="relative mx-auto max-w-md lg:max-w-none">
                      <div
                        className="pointer-events-none absolute -inset-4 rounded-3xl bg-brand/10 blur-2xl"
                        aria-hidden
                      />
                      <InvoicePaperPreview
                        template={template.id}
                        className="relative scale-105 shadow-xl lg:scale-110"
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-20 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/register">Start with Classic — free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">Unlock all templates</Link>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
