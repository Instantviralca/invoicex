import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { usageCounters } from "@/db/schema";

export function currentPeriodKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function getUsageForPeriod(workspaceId: string, periodKey?: string) {
  const key = periodKey ?? currentPeriodKey();
  const [row] = await db
    .select()
    .from(usageCounters)
    .where(
      and(
        eq(usageCounters.workspaceId, workspaceId),
        eq(usageCounters.periodKey, key),
      ),
    )
    .limit(1);

  return {
    periodKey: key,
    documentsCreated: row?.documentsCreated ?? 0,
    emailsSent: row?.emailsSent ?? 0,
  };
}

export async function incrementDocumentUsage(workspaceId: string) {
  const periodKey = currentPeriodKey();
  await db
    .insert(usageCounters)
    .values({
      workspaceId,
      periodKey,
      documentsCreated: 1,
    })
    .onConflictDoUpdate({
      target: [usageCounters.workspaceId, usageCounters.periodKey],
      set: {
        documentsCreated: sql`${usageCounters.documentsCreated} + 1`,
        updatedAt: new Date(),
      },
    });
}

export async function incrementEmailUsage(workspaceId: string) {
  const periodKey = currentPeriodKey();
  await db
    .insert(usageCounters)
    .values({
      workspaceId,
      periodKey,
      emailsSent: 1,
    })
    .onConflictDoUpdate({
      target: [usageCounters.workspaceId, usageCounters.periodKey],
      set: {
        emailsSent: sql`${usageCounters.emailsSent} + 1`,
        updatedAt: new Date(),
      },
    });
}
