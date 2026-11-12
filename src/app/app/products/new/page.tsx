import { redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { CatalogueForm } from "@/components/app/catalogue-form";
import { requireAppContext } from "@/lib/app-context";
import { membershipSubscriptionStatus } from "@/lib/billing/access";
import { canUseCatalogue } from "@/lib/entitlements";

export default async function NewProductPage() {
  const { membership } = await requireAppContext();
  if (
    !canUseCatalogue(
      membership.workspace.planId,
      membershipSubscriptionStatus(membership),
    )
  ) {
    redirect("/app/products");
  }

  return (
    <div>
      <PageHeader title="Add catalogue item" description="Create a reusable product or service." />
      <CatalogueForm />
    </div>
  );
}
