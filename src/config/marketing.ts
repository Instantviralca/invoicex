import { brand } from "@/config/brand";

/**
 * Marketing and product copy for InvoiceX (UK English).
 * Update here to refresh homepage, auth, and key landing pages together.
 */
export const marketing = {
  heroEyebrow: "UK invoice & quote software",
  heroHeadline: "Send invoices and quotes your clients actually read",
  heroSubhead: `${brand.productName} keeps documents, clients and payment status in one workspace — less time on admin, more time on paid work.`,
  heroBullets: [
    "Free plan — no card required",
    "Cancel paid plans online anytime",
    "Hosted by a UK registered company",
  ] as const,
  trustStrip: [
    "Built for UK freelancers and SMEs",
    "VAT-ready line items and totals",
    "Professional PDFs on every plan",
    "Cancel subscriptions online",
    `Help at ${brand.supportEmail}`,
  ] as const,
  authAside:
    "Issue UK invoices and quotes from one account. Start on the Free plan — no card required.",
  contactIntro:
    "Questions about billing, your account, or getting started? We aim to reply within two working days.",
  aboutLead: `${brand.productName} is invoicing and quote software for UK freelancers, contractors, and small teams — operated from ${brand.domain}.`,
  finalCtaTitle: "Open your free workspace on InvoiceX",
  finalCtaBody:
    "Add your business profile once, then create your first invoice or quote when you are ready. Upgrade only when you outgrow the Free plan.",
} as const;
