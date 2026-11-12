import { PageHeader } from "@/components/app/page-header";
import { DocumentEditor } from "@/components/app/document-editor";
import { requireAppContext } from "@/lib/app-context";
import { getEditorBootstrap } from "@/lib/services/document-data";

export default async function NewInvoicePage() {
  const { membership } = await requireAppContext();
  const bootstrap = await getEditorBootstrap(
    membership.workspaceId,
    membership.workspace.planId,
  );

  return (
    <div>
      <PageHeader
        title="New invoice"
        description="Add line items and save as a draft. Totals are calculated on the server when you save."
      />
      <DocumentEditor
        type="invoice"
        clients={bootstrap.clients}
        catalogue={bootstrap.catalogue}
        defaultPaymentTermsDays={bootstrap.defaultPaymentTermsDays}
        initial={{
          lineItems: [
            {
              description: "",
              quantity: "1",
              unit: "unit",
              unitPriceMinor: 0,
              discountMinor: 0,
              taxRatePercent: bootstrap.defaultTaxRatePercent,
            },
          ],
        }}
      />
    </div>
  );
}
