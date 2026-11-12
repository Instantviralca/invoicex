import { LegalDocument } from "@/components/marketing/legal-document";
import { securitySections } from "@/lib/legal-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Security",
  description:
    "How InvoiceX protects your data, secure checkout practices, and your security responsibilities.",
  path: "/security",
});

export default function SecurityPage() {
  return (
    <LegalDocument
      title="Security"
      description="An overview of how we protect InvoiceX and your responsibilities as a user."
      lastUpdated="21 September 2026"
      sections={securitySections}
    />
  );
}
