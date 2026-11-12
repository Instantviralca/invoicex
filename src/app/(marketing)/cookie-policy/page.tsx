import { LegalDocument } from "@/components/marketing/legal-document";
import { cookieSections } from "@/lib/legal-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Cookie Policy",
  description:
    "How InvoiceX uses cookies and similar technologies, and how to manage your preferences.",
  path: "/cookie-policy",
});

export default function CookiePolicyPage() {
  return (
    <LegalDocument
      title="Cookie Policy"
      description="Information about cookies and similar technologies used on InvoiceX."
      lastUpdated="21 September 2026"
      sections={cookieSections}
    />
  );
}
