import { LegalDocument } from "@/components/marketing/legal-document";
import { legalLastUpdated } from "@/config/brand";
import { refundSections } from "@/lib/legal-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Refund Policy",
  description:
    "InvoiceX refund policy for paid subscriptions, billing errors, and consumer rights.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalDocument
      title="Refund Policy"
      description="When refunds may be available for InvoiceX paid subscriptions."
      lastUpdated={legalLastUpdated}
      sections={refundSections}
    />
  );
}
