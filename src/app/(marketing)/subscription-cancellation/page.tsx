import { LegalDocument } from "@/components/marketing/legal-document";
import { legalLastUpdated } from "@/config/brand";
import { cancellationSections } from "@/lib/legal-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Subscription Cancellation Policy",
  description:
    "How to cancel your InvoiceX subscription online and what happens to your account.",
  path: "/subscription-cancellation",
});

export default function SubscriptionCancellationPage() {
  return (
    <LegalDocument
      title="Subscription Cancellation Policy"
      description="Cancel online at any time. Access continues until the end of your paid period."
      lastUpdated={legalLastUpdated}
      sections={cancellationSections}
    />
  );
}
