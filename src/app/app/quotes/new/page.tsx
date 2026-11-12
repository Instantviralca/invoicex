import { PageHeader } from "@/components/app/page-header";
import { DocumentEditor } from "@/components/app/document-editor";
import { requireAppContext } from "@/lib/app-context";
import { getEditorBootstrap } from "@/lib/services/document-data";

export default async function NewQuotePage() {
  const { membership } = await requireAppContext();
  const bootstrap = await getEditorBootstrap(
    membership.workspaceId,
    membership.workspace.planId,
  );

  return (
    <div>
      <PageHeader
        title="New quote"
        description="Build a quotation and send it when ready."
      />
      <DocumentEditor
        type="quote"
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
