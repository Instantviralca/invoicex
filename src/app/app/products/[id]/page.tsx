import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { CatalogueForm } from "@/components/app/catalogue-form";
import { requireAppContext } from "@/lib/app-context";
import { membershipSubscriptionStatus } from "@/lib/billing/access";
import { canUseCatalogue } from "@/lib/entitlements";
import { getCatalogueItem } from "@/lib/services/catalogue";

type PageProps = { params: Promise<{ id: string }> };

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { membership } = await requireAppContext();
  if (
    !canUseCatalogue(
      membership.workspace.planId,
      membershipSubscriptionStatus(membership),
    )
  ) {
    redirect("/app/products");
  }

  const item = await getCatalogueItem(membership.workspaceId, id);
  if (!item) notFound();

  return (
    <div>
      <PageHeader title={item.name} description="Edit catalogue item details." />
      <CatalogueForm
        itemId={item.id}
        initial={{
          name: item.name,
          description: item.description ?? "",
          sku: item.sku ?? "",
          type: item.type,
          unit: item.unit,
          unitPriceMinor: item.unitPriceMinor,
          defaultTaxRatePercent: item.defaultTaxRatePercent,
          currency: item.currency,
        }}
      />
    </div>
  );
}
