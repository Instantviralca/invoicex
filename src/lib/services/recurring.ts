import { addDays, addMonths, addYears, format, parseISO } from "date-fns";
import { and, asc, count, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  businessProfiles,
  clients,
  invoiceLineItems,
  invoices,
  recurringInvoices,
} from "@/db/schema";
import { getWorkspaceSubscriptionStatus } from "@/lib/billing/access";
import { canEmailDocuments, canUseRecurring } from "@/lib/entitlements";
import { sendInvoiceEmail } from "@/lib/email/document-emails";
import { generateUrlSafeToken } from "@/lib/crypto";
import { allocateInvoiceNumber } from "@/lib/numbering";
import {
  clientAddressSnapshot,
  computeLineItemsWithTotals,
} from "@/lib/services/documents-shared";
import { getUsageForPeriod, incrementDocumentUsage } from "@/lib/services/usage";
import type { RecurringFormValues } from "@/lib/validations/recurring";

export type RecurringLineItemTemplate = {
  description: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  discountMinor?: number;
  taxRatePercent: string;
  catalogueItemId?: string | null;
};

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  semiannual: "Every six months",
  annually: "Annually",
  custom: "Custom interval",
};

export function frequencyLabel(
  frequency: string,
  customIntervalDays?: number | null,
): string {
  if (frequency === "custom" && customIntervalDays) {
    return `Every ${customIntervalDays} day${customIntervalDays === 1 ? "" : "s"}`;
  }
  return FREQUENCY_LABELS[frequency] ?? frequency;
}

export function advanceRecurringDate(
  current: string,
  frequency: string,
  customIntervalDays?: number | null,
): string {
  const date = parseISO(current);

  switch (frequency) {
    case "weekly":
      return format(addDays(date, 7), "yyyy-MM-dd");
    case "monthly":
      return format(addMonths(date, 1), "yyyy-MM-dd");
    case "quarterly":
      return format(addMonths(date, 3), "yyyy-MM-dd");
    case "semiannual":
      return format(addMonths(date, 6), "yyyy-MM-dd");
    case "annually":
      return format(addYears(date, 1), "yyyy-MM-dd");
    case "custom":
      return format(addDays(date, customIntervalDays ?? 30), "yyyy-MM-dd");
    default:
      return format(addMonths(date, 1), "yyyy-MM-dd");
  }
}

export async function listRecurringInvoices(
  workspaceId: string,
  options: { page: number; pageSize: number },
) {
  const rows = await db
    .select({
      recurring: recurringInvoices,
      clientName: clients.contactName,
      businessName: clients.businessName,
    })
    .from(recurringInvoices)
    .innerJoin(clients, eq(clients.id, recurringInvoices.clientId))
    .where(eq(recurringInvoices.workspaceId, workspaceId))
    .orderBy(desc(recurringInvoices.updatedAt))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);

  const [totalRow] = await db
    .select({ count: count() })
    .from(recurringInvoices)
    .where(eq(recurringInvoices.workspaceId, workspaceId));

  return {
    items: rows.map(({ recurring, clientName, businessName }) => ({
      ...recurring,
      clientName: businessName ?? clientName,
      frequencyLabel: frequencyLabel(
        recurring.frequency,
        recurring.customIntervalDays,
      ),
    })),
    total: totalRow?.count ?? 0,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getRecurringInvoice(workspaceId: string, id: string) {
  const [row] = await db
    .select({
      recurring: recurringInvoices,
      clientName: clients.contactName,
      businessName: clients.businessName,
    })
    .from(recurringInvoices)
    .innerJoin(clients, eq(clients.id, recurringInvoices.clientId))
    .where(
      and(eq(recurringInvoices.id, id), eq(recurringInvoices.workspaceId, workspaceId)),
    )
    .limit(1);

  if (!row) return null;

  return {
    ...row.recurring,
    clientName: row.businessName ?? row.clientName,
    lineItems: row.recurring.lineItemsTemplate as RecurringLineItemTemplate[],
    frequencyLabel: frequencyLabel(
      row.recurring.frequency,
      row.recurring.customIntervalDays,
    ),
  };
}

async function getDefaultBusinessProfile(workspaceId: string) {
  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(
      and(
        eq(businessProfiles.workspaceId, workspaceId),
        eq(businessProfiles.isDefault, true),
      ),
    )
    .limit(1);
  return profile;
}

export async function createRecurringInvoice(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  values: RecurringFormValues,
) {
  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);
  if (!canUseRecurring(planId, subscriptionStatus)) {
    throw new Error("Recurring invoices require a Pro plan or higher.");
  }

  const profile = await getDefaultBusinessProfile(workspaceId);
  if (!profile) throw new Error("Business profile not found.");

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, values.clientId), eq(clients.workspaceId, workspaceId)))
    .limit(1);
  if (!client) throw new Error("Client not found.");

  if (values.frequency === "custom" && !values.customIntervalDays) {
    throw new Error("Custom frequency requires an interval in days.");
  }

  const [created] = await db
    .insert(recurringInvoices)
    .values({
      workspaceId,
      clientId: values.clientId,
      businessProfileId: profile.id,
      frequency: values.frequency,
      customIntervalDays: values.customIntervalDays ?? null,
      startDate: values.startDate,
      endDate: values.endDate ?? null,
      nextRunDate: values.startDate,
      autoSend: values.autoSend,
      active: values.active,
      lineItemsTemplate: values.lineItems,
      notes: values.notes ?? null,
      terms: values.terms ?? null,
      paymentInstructions: values.paymentInstructions ?? null,
      currency: values.currency,
    })
    .returning();

  return getRecurringInvoice(workspaceId, created!.id);
}

export async function updateRecurringInvoice(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  id: string,
  values: RecurringFormValues,
) {
  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);
  if (!canUseRecurring(planId, subscriptionStatus)) {
    throw new Error("Recurring invoices require a Pro plan or higher.");
  }

  const existing = await getRecurringInvoice(workspaceId, id);
  if (!existing) throw new Error("NotFound");

  await db
    .update(recurringInvoices)
    .set({
      clientId: values.clientId,
      frequency: values.frequency,
      customIntervalDays: values.customIntervalDays ?? null,
      startDate: values.startDate,
      endDate: values.endDate ?? null,
      nextRunDate: values.nextRunDate ?? existing.nextRunDate,
      autoSend: values.autoSend,
      active: values.active,
      lineItemsTemplate: values.lineItems,
      notes: values.notes ?? null,
      terms: values.terms ?? null,
      paymentInstructions: values.paymentInstructions ?? null,
      currency: values.currency,
      updatedAt: new Date(),
    })
    .where(
      and(eq(recurringInvoices.id, id), eq(recurringInvoices.workspaceId, workspaceId)),
    );

  return getRecurringInvoice(workspaceId, id);
}

export async function deleteRecurringInvoice(workspaceId: string, id: string) {
  await db
    .delete(recurringInvoices)
    .where(
      and(eq(recurringInvoices.id, id), eq(recurringInvoices.workspaceId, workspaceId)),
    );
}

async function createInvoiceFromRecurring(
  recurring: typeof recurringInvoices.$inferSelect,
  runDate: string,
  planId: "free" | "starter" | "pro" | "business",
) {
  const lineItems = (recurring.lineItemsTemplate as RecurringLineItemTemplate[]).map(
    (line, index) => ({
      ...line,
      discountMinor: line.discountMinor ?? 0,
      position: index,
    }),
  );
  const paymentTerms =
    (await db
      .select({ days: businessProfiles.defaultPaymentTermsDays })
      .from(businessProfiles)
      .where(eq(businessProfiles.id, recurring.businessProfileId))
      .limit(1)
      .then((rows) => rows[0]?.days)) ?? 30;

  const dueDate = format(addDays(parseISO(runDate), paymentTerms), "yyyy-MM-dd");

  const { totals, enrichedLines } = computeLineItemsWithTotals(lineItems, {
    shippingMinor: 0,
    pricesInclusiveOfTax: false,
  });

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, recurring.clientId))
    .limit(1);

  const usage = await getUsageForPeriod(recurring.workspaceId);
  const subscriptionStatus = await getWorkspaceSubscriptionStatus(
    recurring.workspaceId,
  );
  const { assertDocumentCapacity } = await import("@/lib/entitlements");
  assertDocumentCapacity(planId, usage.documentsCreated, subscriptionStatus);

  const invoiceNumber = await allocateInvoiceNumber(
    recurring.businessProfileId,
    recurring.workspaceId,
  );

  const [invoice] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(invoices)
      .values({
        workspaceId: recurring.workspaceId,
        businessProfileId: recurring.businessProfileId,
        clientId: recurring.clientId,
        invoiceNumber,
        status: recurring.autoSend ? "sent" : "draft",
        issueDate: runDate,
        dueDate,
        currency: recurring.currency,
        notes: recurring.notes,
        paymentInstructions: recurring.paymentInstructions,
        terms: recurring.terms,
        subtotalMinor: totals.subtotalMinor,
        discountTotalMinor: totals.discountTotalMinor,
        taxTotalMinor: totals.taxTotalMinor,
        shippingMinor: totals.shippingMinor,
        grandTotalMinor: totals.grandTotalMinor,
        billingAddressSnapshot: client ? clientAddressSnapshot(client) : null,
        sentAt: recurring.autoSend ? new Date() : null,
        publicToken: recurring.autoSend ? generateUrlSafeToken(32) : null,
      })
      .returning();

    if (enrichedLines.length) {
      await tx.insert(invoiceLineItems).values(
        enrichedLines.map((line) => ({
          invoiceId: created!.id,
          workspaceId: recurring.workspaceId,
          catalogueItemId: line.catalogueItemId ?? null,
          position: line.position,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          unitPriceMinor: line.unitPriceMinor,
          discountMinor: line.discountMinor,
          taxRatePercent: line.taxRatePercent,
          lineSubtotalMinor: line.lineSubtotalMinor,
          lineTaxMinor: line.lineTaxMinor,
          lineTotalMinor: line.lineTotalMinor,
        })),
      );
    }

    await incrementDocumentUsage(recurring.workspaceId);
    return [created];
  });

  return invoice!;
}

export async function processDueRecurringInvoices(
  planResolver: (workspaceId: string) => Promise<"free" | "starter" | "pro" | "business">,
  runDate = format(new Date(), "yyyy-MM-dd"),
  limit = 50,
) {
  const due = await db
    .select()
    .from(recurringInvoices)
    .where(
      and(eq(recurringInvoices.active, true), lte(recurringInvoices.nextRunDate, runDate)),
    )
    .orderBy(asc(recurringInvoices.nextRunDate))
    .limit(limit);

  let processed = 0;
  let skipped = 0;
  const createdInvoiceIds: string[] = [];

  for (const recurring of due) {
    const runKey = `${recurring.id}:${recurring.nextRunDate}`;
    if (recurring.lastRunKey === runKey) {
      skipped += 1;
      continue;
    }

    if (recurring.endDate && recurring.nextRunDate > recurring.endDate) {
      await db
        .update(recurringInvoices)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(recurringInvoices.id, recurring.id));
      skipped += 1;
      continue;
    }

    const planId = await planResolver(recurring.workspaceId);
    const subscriptionStatus = await getWorkspaceSubscriptionStatus(
      recurring.workspaceId,
    );
    if (!canUseRecurring(planId, subscriptionStatus)) {
      skipped += 1;
      continue;
    }

    const invoice = await createInvoiceFromRecurring(recurring, recurring.nextRunDate, planId);

    if (recurring.autoSend && canEmailDocuments(planId, subscriptionStatus)) {
      await sendInvoiceEmail({
        workspaceId: recurring.workspaceId,
        planId,
        invoiceId: invoice.id,
        userId: "",
      }).catch(() => undefined);
    }

    const nextRunDate = advanceRecurringDate(
      recurring.nextRunDate,
      recurring.frequency,
      recurring.customIntervalDays,
    );

    await db
      .update(recurringInvoices)
      .set({
        lastRunKey: runKey,
        nextRunDate,
        active:
          recurring.endDate && nextRunDate > recurring.endDate
            ? false
            : recurring.active,
        updatedAt: new Date(),
      })
      .where(eq(recurringInvoices.id, recurring.id));

    processed += 1;
    createdInvoiceIds.push(invoice.id);
  }

  return { processed, skipped, createdInvoiceIds };
}
