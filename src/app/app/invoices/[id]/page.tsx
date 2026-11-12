import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { DocumentEditor } from "@/components/app/document-editor";
import { DocumentActions } from "@/components/app/document-actions";
import { InvoiceStatusBadge } from "@/components/ui/status-badge";
import { requireAppContext } from "@/lib/app-context";
import { deriveInvoiceStatus } from "@/lib/document-status";
import { getInvoiceWithLines } from "@/lib/services/invoices";
import { getEditorBootstrap } from "@/lib/services/document-data";
import type { PaymentDerivedStatus } from "@/lib/document-status";

type PageProps = { params: Promise<{ id: string }> };

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { membership } = await requireAppContext();

  const [document, bootstrap] = await Promise.all([
    getInvoiceWithLines(membership.workspaceId, id),
    getEditorBootstrap(membership.workspaceId, membership.workspace.planId),
  ]);

  if (!document) notFound();

  const derivedStatus = deriveInvoiceStatus({
    baseStatus: document.invoice.status,
    dueDate: document.invoice.dueDate,
    amountPaidMinor: document.invoice.amountPaidMinor,
    grandTotalMinor: document.invoice.grandTotalMinor,
  });

  const readOnly = document.invoice.status !== "draft";

  return (
    <div>
      <PageHeader
        title={document.invoice.invoiceNumber}
        description={`Invoice for ${document.client?.businessName ?? document.client?.contactName ?? "client"}`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <InvoiceStatusBadge status={derivedStatus as PaymentDerivedStatus} />
            <DocumentActions
              type="invoice"
              documentId={id}
              status={document.invoice.status}
            />
          </div>
        }
      />

      {readOnly ? (
        <p className="mb-4 text-sm text-foreground-muted">
          This invoice has been issued. Line items are locked; use actions to record
          payments or void.
        </p>
      ) : null}

      <DocumentEditor
        type="invoice"
        documentId={id}
        clients={bootstrap.clients}
        catalogue={bootstrap.catalogue}
        defaultPaymentTermsDays={bootstrap.defaultPaymentTermsDays}
        initial={{
          clientId: document.invoice.clientId,
          issueDate: document.invoice.issueDate,
          dueOrValidDate: document.invoice.dueDate,
          currency: document.invoice.currency,
          notes: document.invoice.notes ?? "",
          paymentInstructions: document.invoice.paymentInstructions ?? "",
          terms: document.invoice.terms ?? "",
          template: document.invoice.template,
          accentColour: document.invoice.accentColour ?? undefined,
          pricesInclusiveOfTax: document.invoice.pricesInclusiveOfTax,
          shippingMinor: document.invoice.shippingMinor,
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
