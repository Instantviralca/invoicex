import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { invoices, reminderSchedules, workspaces } from "@/db/schema";
import { canUseReminders } from "@/lib/entitlements";
import { sendPaymentReminderEmail } from "@/lib/email/document-emails";

export type ReminderScheduleInput = {
  offsetDays: number;
  enabled: boolean;
  invoiceId?: string | null;
  clientId?: string | null;
};

export async function listReminderSchedules(workspaceId: string) {
  return db
    .select()
    .from(reminderSchedules)
    .where(eq(reminderSchedules.workspaceId, workspaceId))
    .orderBy(reminderSchedules.offsetDays);
}

export async function upsertWorkspaceReminderSchedules(
  workspaceId: string,
  schedules: ReminderScheduleInput[],
) {
  await db
    .delete(reminderSchedules)
    .where(
      and(
        eq(reminderSchedules.workspaceId, workspaceId),
        isNull(reminderSchedules.invoiceId),
      ),
    );

  if (schedules.length) {
    await db.insert(reminderSchedules).values(
      schedules.map((schedule) => ({
        workspaceId,
        invoiceId: null,
        clientId: schedule.clientId ?? null,
        offsetDays: schedule.offsetDays,
        enabled: schedule.enabled,
      })),
    );
  }
}

export async function upsertInvoiceReminderSchedules(
  workspaceId: string,
  invoiceId: string,
  schedules: ReminderScheduleInput[],
) {
  await db
    .delete(reminderSchedules)
    .where(
      and(
        eq(reminderSchedules.workspaceId, workspaceId),
        eq(reminderSchedules.invoiceId, invoiceId),
      ),
    );

  if (schedules.length) {
    await db.insert(reminderSchedules).values(
      schedules.map((schedule) => ({
        workspaceId,
        invoiceId,
        clientId: schedule.clientId ?? null,
        offsetDays: schedule.offsetDays,
        enabled: schedule.enabled,
      })),
    );
  }
}

function reminderMatchesToday(dueDate: string, offsetDays: number, today: string): boolean {
  const due = parseISO(dueDate);
  const current = parseISO(today);
  const diff = differenceInCalendarDays(current, due);
  return diff === offsetDays;
}

export async function processPaymentReminders(
  runDate = format(new Date(), "yyyy-MM-dd"),
  batchLimit = 50,
) {
  const openStatuses = ["sent", "viewed", "partially_paid"] as const;

  const candidates = await db
    .select({
      invoice: invoices,
      planId: workspaces.planId,
    })
    .from(invoices)
    .innerJoin(workspaces, eq(workspaces.id, invoices.workspaceId))
    .where(
      and(
        inArray(invoices.status, [...openStatuses]),
        eq(invoices.remindersEnabled, true),
      ),
    )
    .limit(batchLimit * 4);

  let sent = 0;
  let skipped = 0;

  for (const { invoice, planId } of candidates) {
    if (sent >= batchLimit) break;
    if (!canUseReminders(planId)) {
      skipped += 1;
      continue;
    }

    const schedules = await db
      .select()
      .from(reminderSchedules)
      .where(
        and(
          eq(reminderSchedules.workspaceId, invoice.workspaceId),
          eq(reminderSchedules.enabled, true),
          or(
            isNull(reminderSchedules.invoiceId),
            eq(reminderSchedules.invoiceId, invoice.id),
          ),
        ),
      );

    if (!schedules.length) {
      skipped += 1;
      continue;
    }

    for (const schedule of schedules) {
      if (!reminderMatchesToday(invoice.dueDate, schedule.offsetDays, runDate)) {
        continue;
      }

      const sentKey = `${invoice.id}:${schedule.offsetDays}:${invoice.dueDate}`;
      if (schedule.lastSentKey === sentKey) {
        skipped += 1;
        continue;
      }

      const daysOverdue = differenceInCalendarDays(
        parseISO(runDate),
        parseISO(invoice.dueDate),
      );

      const result = await sendPaymentReminderEmail({
        workspaceId: invoice.workspaceId,
        planId,
        invoiceId: invoice.id,
        daysOverdue,
      });

      if ("skipped" in result) {
        skipped += 1;
        continue;
      }

      if (result.success) {
        await db
          .update(reminderSchedules)
          .set({ lastSentKey: sentKey, updatedAt: new Date() })
          .where(eq(reminderSchedules.id, schedule.id));
        sent += 1;
      } else {
        skipped += 1;
      }

      if (sent >= batchLimit) break;
    }
  }

  return { sent, skipped };
}
