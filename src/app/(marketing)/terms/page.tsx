import { LegalDocument } from "@/components/marketing/legal-document";
import { legalLastUpdated } from "@/config/brand";
import { termsSections } from "@/lib/legal-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description:
    "Terms governing your use of InvoiceX, subscriptions, content responsibilities, and liability.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="The contract between you and THE HOUSE OF VEYNOR LTD for use of InvoiceX."
      lastUpdated={legalLastUpdated}
      sections={termsSections}
    />
  );
}
