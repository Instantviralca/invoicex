import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { RecurringList } from "@/components/app/recurring-list";
import { UpgradePrompt } from "@/components/app/upgrade-prompt";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/app-context";
import { membershipSubscriptionStatus } from "@/lib/billing/access";
import { canUseRecurring } from "@/lib/entitlements";
import { listRecurringInvoices } from "@/lib/services/recurring";

export default async function RecurringPage() {
  const { membership } = await requireAppContext();

  if (
    !canUseRecurring(
      membership.workspace.planId,
      membershipSubscriptionStatus(membership),
    )
  ) {
    return (
      <div>
        <PageHeader title="Recurring invoices" description="Automate repeat billing." />
        <UpgradePrompt
          title="Recurring invoices on Pro"
          description="Upgrade to schedule automatic invoice generation."
          feature="Recurring invoices"
        />
      </div>
    );
  }

  const result = await listRecurringInvoices(membership.workspaceId, {
    page: 1,
    pageSize: 50,
  });

  return (
    <div>
      <PageHeader
        title="Recurring invoices"
        description="Schedule invoices to generate automatically."
        actions={
          <Button asChild>
            <Link href="/app/recurring/new">
              <Plus className="size-4" />
              New schedule
            </Link>
          </Button>
        }
      />
      {result.items.length ? (
        <RecurringList items={result.items} />
      ) : (
        <EmptyState
          title="No recurring schedules"
          description="Create a schedule to generate draft or sent invoices on a repeating cadence."
          action={
            <Button asChild>
              <Link href="/app/recurring/new">Create schedule</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
