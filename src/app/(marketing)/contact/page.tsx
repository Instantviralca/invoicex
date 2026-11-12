import Link from "next/link";
import { Building2, HelpCircle, Mail, Phone } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { ContactForm } from "@/components/marketing/contact-form";
import { brand, company } from "@/config/brand";
import { marketing } from "@/config/marketing";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact InvoiceX support for product help, billing questions, and account enquiries.",
  path: "/contact",
});

const contactDetails: Array<{
  icon: typeof Mail;
  title: string;
  content: React.ReactNode;
  note?: string;
}> = [
  {
    icon: Mail,
    title: "Sales & support",
    content: (
      <a
        href={`mailto:${brand.supportEmail}`}
        className="font-medium text-brand hover:underline"
      >
        {brand.supportEmail}
      </a>
    ),
    note: "For account-specific issues, email from the address registered to your account.",
  },
  {
    icon: Phone,
    title: "Phone",
    content: (
      <a
        href={`tel:${brand.supportPhoneTel}`}
        className="font-medium text-brand hover:underline"
      >
        {brand.supportPhone}
      </a>
    ),
    note: "UK business hours. If we miss your call, email us and we will follow up.",
  },
  {
    icon: Building2,
    title: "Company",
    content: (
      <>
        <p>{company.legalName}</p>
        <p>Company number {company.companyNumber}</p>
        <p>{company.registeredOfficeSingleLine}</p>
      </>
    ),
  },
  {
    icon: HelpCircle,
    title: "Help Centre",
    content: (
      <p>
        Many common questions are answered in our{" "}
        <Link href="/help" className="font-medium text-brand hover:underline">
          Help Centre
        </Link>
        .
      </p>
    ),
  },
] as const;

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-border-soft py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-deep">
              Contact
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Get in touch
            </h1>
            <p className="mt-4 text-base leading-relaxed text-foreground-muted">
              {marketing.contactIntro} For account-specific issues, email from the address linked
              to your login.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
            <aside className="space-y-4">
              {contactDetails.map((item) => (
                <div key={item.title} className="surface-card p-5">
                  <div className="flex items-start gap-3">
                    <item.icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                    <div>
                      <h2 className="font-display text-base font-semibold text-foreground">
                        {item.title}
                      </h2>
                      <div className="mt-2 space-y-1 text-sm leading-relaxed text-foreground-muted">
                        {item.content}
                      </div>
                      {item.note ? (
                        <p className="mt-3 text-xs text-foreground-subtle">{item.note}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </aside>

            <div className="surface-card p-6 sm:p-8 lg:p-10">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Send us a message
              </h2>
              <p className="mt-2 text-sm text-foreground-muted">
                Complete the form below and we will get back to you as soon as we can.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
