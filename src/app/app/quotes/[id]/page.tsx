import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { DocumentEditor } from "@/components/app/document-editor";
import { DocumentActions } from "@/components/app/document-actions";
import { QuoteStatusBadge } from "@/components/ui/status-badge";
import { requireAppContext } from "@/lib/app-context";
import { deriveQuoteStatus } from "@/lib/document-status";
import { getQuoteWithLines } from "@/lib/services/quotes";
import { getEditorBootstrap } from "@/lib/services/document-data";
import type { QuoteStatus } from "@/lib/document-status";

type PageProps = { params: Promise<{ id: string }> };

export default async function QuoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { membership } = await requireAppContext();

  const [document, bootstrap] = await Promise.all([
    getQuoteWithLines(membership.workspaceId, id),
    getEditorBootstrap(membership.workspaceId, membership.workspace.planId),
  ]);

  if (!document) notFound();

  const derivedStatus = deriveQuoteStatus({
    baseStatus: document.quote.status,
    validUntil: document.quote.validUntil,
  });

  return (
    <div>
      <PageHeader
        title={document.quote.quoteNumber}
        description={`Quote for ${document.client?.businessName ?? document.client?.contactName ?? "client"}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <QuoteStatusBadge status={derivedStatus as QuoteStatus} />
            <DocumentActions
              type="quote"
              documentId={id}
              status={document.quote.status}
            />
          </div>
        }
      />

      <DocumentEditor
        type="quote"
        documentId={id}
        clients={bootstrap.clients}
        catalogue={bootstrap.catalogue}
        defaultPaymentTermsDays={bootstrap.defaultPaymentTermsDays}
        initial={{
          clientId: document.quote.clientId,
          issueDate: document.quote.issueDate,
          dueOrValidDate: document.quote.validUntil,
          currency: document.quote.currency,
          notes: document.quote.notes ?? "",
          terms: document.quote.terms ?? "",
          template: document.quote.template,
          accentColour: document.quote.accentColour ?? undefined,
          pricesInclusiveOfTax: document.quote.pricesInclusiveOfTax,
          shippingMinor: document.quote.shippingMinor,
          lineItems: document.lines.map((line) => ({
            id: line.id,
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPriceMinor: line.unitPriceMinor,
            discountMinor: line.discountMinor,
            taxRatePercent: line.taxRatePercent,
            catalogueItemId: line.catalogueItemId,
            position: line.position,
          })),
        }}
      />
    </div>
  );
}
