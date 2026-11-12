import { PageHeader } from "@/components/app/page-header";
import { RecurringForm } from "@/components/app/recurring-form";
import { requireAppContext } from "@/lib/app-context";
import { membershipSubscriptionStatus } from "@/lib/billing/access";
import { canUseRecurring } from "@/lib/entitlements";
import { listClients } from "@/lib/services/clients";
import { redirect } from "next/navigation";

export default async function NewRecurringPage() {
  const { membership } = await requireAppContext();

  if (
    !canUseRecurring(
      membership.workspace.planId,
      membershipSubscriptionStatus(membership),
    )
  ) {
    redirect("/app/recurring");
  }

  const clients = await listClients(membership.workspaceId, {
    page: 1,
    pageSize: 100,
    order: "asc",
    archived: "false",
    clientType: "all",
  });

  return (
    <div>
      <PageHeader
        title="New recurring schedule"
        description="Define line items and how often invoices should generate."
      />
      <RecurringForm
        clients={clients.items.map((client) => ({
          id: client.id,
          label: client.businessName ?? client.contactName,
        }))}
      />
    </div>
  );
}
