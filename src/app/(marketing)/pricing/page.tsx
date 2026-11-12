import Link from "next/link";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { CtaBand } from "@/components/marketing/cta-band";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { createPageMetadata } from "@/lib/metadata";
import { pricingNotes } from "@/config/brand";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Compare InvoiceX Free, Starter, Pro, and Business plans. Monthly and annual billing, VAT note, cancellation, and fair use explained.",
  path: "/pricing",
});

const highlights = [
  {
    icon: Sparkles,
    title: "Free to start",
    description: pricingNotes.freePlan,
  },
  {
    icon: CreditCard,
    title: "Secure billing",
    description: pricingNotes.processor,
  },
  {
    icon: ShieldCheck,
    title: "Cancel online",
    description: pricingNotes.cancellation,
  },
] as const;

export default function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border-soft py-16 sm:py-24">
        <div className="pointer-events-none absolute inset-0 marketing-grid opacity-60" aria-hidden />
        <Container className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Pricing
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Plans for every stage of your business
            </h1>
            <p className="mt-5 text-base leading-relaxed text-foreground-muted sm:text-lg">
              Choose the plan that matches how often you invoice and which features you need.
              Upgrade or cancel online at any time.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="surface-card flex flex-col items-center p-5 text-center sm:items-start sm:text-left"
              >
                <item.icon className="size-5 text-brand" aria-hidden />
                <h2 className="mt-3 font-display text-base font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-24">
        <Container size="wide">
          <PricingCards />
        </Container>
      </section>

      <section className="border-t border-border-soft bg-background-muted/40 pb-16 sm:pb-24">
        <Container className="pt-16">
          <CtaBand
            title="Start with Free, upgrade when ready"
            description="No card required to create your account and send your first documents."
            primaryLabel="Start free"
            primaryHref="/register"
            secondaryLabel="Contact us"
            secondaryHref="/contact"
            className="border-brand/20 bg-background-elevated shadow-md"
          />
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-foreground-muted">
            {pricingNotes.vatNote}{" "}
            <Link href="/subscription-cancellation" className="font-medium text-brand hover:underline">
              Cancellation policy
            </Link>
            {" · "}
            <Link href="/refund-policy" className="font-medium text-brand hover:underline">
              Refund policy
            </Link>
          </p>
        </Container>
      </section>
    </>
  );
}
