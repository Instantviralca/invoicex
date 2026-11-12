import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { RecurringForm } from "@/components/app/recurring-form";
import { requireAppContext } from "@/lib/app-context";
import { membershipSubscriptionStatus } from "@/lib/billing/access";
import { canUseRecurring } from "@/lib/entitlements";
import { listClients } from "@/lib/services/clients";
import { getRecurringInvoice } from "@/lib/services/recurring";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditRecurringPage({ params }: PageProps) {
  const { id } = await params;
  const { membership } = await requireAppContext();

  if (
    !canUseRecurring(
      membership.workspace.planId,
      membershipSubscriptionStatus(membership),
    )
  ) {
    notFound();
  }

  const recurring = await getRecurringInvoice(membership.workspaceId, id);
  if (!recurring) notFound();

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
        title="Edit recurring schedule"
        description={`${recurring.clientName} · ${recurring.frequencyLabel}`}
      />
      <RecurringForm
        clients={clients.items.map((client) => ({
          id: client.id,
          label: client.businessName ?? client.contactName,
        }))}
        initial={{
          id: recurring.id,
          clientId: recurring.clientId,
          frequency: recurring.frequency,
          customIntervalDays: recurring.customIntervalDays ?? undefined,
          startDate: recurring.startDate,
          endDate: recurring.endDate ?? undefined,
          nextRunDate: recurring.nextRunDate,
          autoSend: recurring.autoSend,
          active: recurring.active,
          currency: recurring.currency,
          notes: recurring.notes ?? undefined,
          terms: recurring.terms ?? undefined,
          paymentInstructions: recurring.paymentInstructions ?? undefined,
          lineItems: recurring.lineItems,
        }}
      />
    </div>
  );
}
