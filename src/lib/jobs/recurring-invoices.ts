import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces } from "@/db/schema";
import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";
import { processDueRecurringInvoices } from "@/lib/services/recurring";

export async function runRecurringInvoicesJob() {
  const idempotencyKey = dailyJobKey("recurring-invoices");

  return runIdempotentJob("recurring-invoices", idempotencyKey, async () => {
    const result = await processDueRecurringInvoices(async (workspaceId) => {
      const [workspace] = await db
        .select({ planId: workspaces.planId })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);
      return workspace?.planId ?? "free";
    });

    return result;
  });
}
