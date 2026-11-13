import { LegalDocument } from "@/components/marketing/legal-document";
import { legalLastUpdated } from "@/config/brand";
import { acceptableUseSections } from "@/lib/legal-content";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Acceptable Use Policy",
  description:
    "Rules for using InvoiceX fairly and lawfully, including fair use of unlimited plans.",
  path: "/acceptable-use",
});

export default function AcceptableUsePage() {
  return (
    <LegalDocument
      title="Acceptable Use Policy"
      description="Permitted and prohibited uses of the InvoiceX platform."
      lastUpdated={legalLastUpdated}
      sections={acceptableUseSections}
    />
  );
}
