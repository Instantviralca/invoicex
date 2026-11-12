import { LegalDocument } from "@/components/marketing/legal-document";
import { privacySections } from "@/lib/legal-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description:
    "How InvoiceX by THE HOUSE OF VEYNOR LTD collects, uses, and protects your personal data under UK GDPR.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="How we collect, use, store, and protect personal data when you use InvoiceX."
      lastUpdated="21 September 2026"
      sections={privacySections}
    />
  );
}
