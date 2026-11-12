import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  businessProfiles,
  clients,
  invoiceLineItems,
  invoiceSnapshots,
  invoices,
  paymentRecords,
} from "@/db/schema";
import { getWorkspaceSubscriptionStatus } from "@/lib/billing/access";
import {
  assertDocumentCapacity,
  assertTemplateAccess,
  canEmailDocuments,
} from "@/lib/entitlements";
import { deriveInvoiceStatus } from "@/lib/document-status";
import { generateUrlSafeToken } from "@/lib/crypto";
import { allocateInvoiceNumber } from "@/lib/numbering";
import { outstandingBalance } from "@/lib/money";
import {
  clientAddressSnapshot,
  computeLineItemsWithTotals,
} from "@/lib/services/documents-shared";
import { getUsageForPeriod, incrementDocumentUsage } from "@/lib/services/usage";
import type { InvoiceFormValues } from "@/lib/validations/invoices";

export async function listInvoices(
  workspaceId: string,
  options: {
    page: number;
    pageSize: number;
    q?: string;
    status?: string;
    order: "asc" | "desc";
  },
) {
  const conditions = [eq(invoices.workspaceId, workspaceId)];

  if (options.q) {
    const term = `%${options.q}%`;
    conditions.push(ilike(invoices.invoiceNumber, term));
  }

  const where = and(...conditions);

  const rows = await db
    .select({
      invoice: invoices,
      clientName: clients.contactName,
      businessName: clients.businessName,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(where)
    .orderBy(desc(invoices.updatedAt))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);

  const [totalRow] = await db
    .select({ count: count() })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(where);

  const items = rows
    .map(({ invoice, clientName, businessName }) => ({
      ...invoice,
      clientName: businessName ?? clientName,
      derivedStatus: deriveInvoiceStatus({
        baseStatus: invoice.status,
        dueDate: invoice.dueDate,
        amountPaidMinor: invoice.amountPaidMinor,
        grandTotalMinor: invoice.grandTotalMinor,
      }),
    }))
    .filter((item) =>
      options.status ? item.derivedStatus === options.status : true,
    );

  return {
    items,
    total: totalRow?.count ?? 0,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getInvoiceWithLines(workspaceId: string, invoiceId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.workspaceId, workspaceId)))
    .limit(1);

  if (!invoice) return null;

  const lines = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))
    .orderBy(invoiceLineItems.position);

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, invoice.clientId))
    .limit(1);

  return { invoice, lines, client };
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

export async function createDraftInvoice(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  values: InvoiceFormValues,
  userId: string,
  existingId?: string,
) {
  const profile = await getDefaultBusinessProfile(workspaceId);
  if (!profile) throw new Error("Business profile not found.");

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, values.clientId), eq(clients.workspaceId, workspaceId)))
    .limit(1);
  if (!client) throw new Error("Client not found.");

  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);

  assertTemplateAccess(planId, values.template, subscriptionStatus);

  const { totals, enrichedLines } = computeLineItemsWithTotals(values.lineItems, {
    shippingMinor: values.shippingMinor,
    pricesInclusiveOfTax: values.pricesInclusiveOfTax,
  });

  if (existingId) {
    const existing = await getInvoiceWithLines(workspaceId, existingId);
    if (!existing || existing.invoice.status !== "draft") {
      throw new Error("Only draft invoices can be updated.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(invoices)
        .set({
          clientId: values.clientId,
          issueDate: values.issueDate,
          dueDate: values.dueDate,
          currency: values.currency,
          customerReference: values.customerReference,
          notes: values.notes,
          paymentInstructions: values.paymentInstructions,
          terms: values.terms,
          footerNote: values.footerNote,
          template: values.template,
          accentColour: values.accentColour,
          pricesInclusiveOfTax: values.pricesInclusiveOfTax,
          shippingMinor: totals.shippingMinor,
          subtotalMinor: totals.subtotalMinor,
          discountTotalMinor: totals.discountTotalMinor,
          taxTotalMinor: totals.taxTotalMinor,
          grandTotalMinor: totals.grandTotalMinor,
          billingAddressSnapshot: clientAddressSnapshot(client),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, existingId));

      await tx.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, existingId));

      if (enrichedLines.length) {
        await tx.insert(invoiceLineItems).values(
          enrichedLines.map((line) => ({
            invoiceId: existingId,
            workspaceId,
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
    });

    return getInvoiceWithLines(workspaceId, existingId);
  }

  const usage = await getUsageForPeriod(workspaceId);
  assertDocumentCapacity(planId, usage.documentsCreated, subscriptionStatus);

  const draftNumber = `DRAFT-${Date.now()}`;

  const [invoice] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(invoices)
      .values({
        workspaceId,
        businessProfileId: profile.id,
        clientId: values.clientId,
        invoiceNumber: draftNumber,
        status: "draft",
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        currency: values.currency,
        customerReference: values.customerReference,
        notes: values.notes ?? profile.defaultInvoiceNotes,
        paymentInstructions:
          values.paymentInstructions ?? profile.defaultPaymentInstructions,
        terms: values.terms,
        footerNote: values.footerNote,
        template: values.template,
        accentColour: values.accentColour ?? profile.accentColour,
        pricesInclusiveOfTax: values.pricesInclusiveOfTax,
        shippingMinor: totals.shippingMinor,
        subtotalMinor: totals.subtotalMinor,
        discountTotalMinor: totals.discountTotalMinor,
        taxTotalMinor: totals.taxTotalMinor,
        grandTotalMinor: totals.grandTotalMinor,
        billingAddressSnapshot: clientAddressSnapshot(client),
      })
      .returning();

    if (!created) throw new Error("Failed to create invoice.");

    if (enrichedLines.length) {
      await tx.insert(invoiceLineItems).values(
        enrichedLines.map((line) => ({
          invoiceId: created.id,
          workspaceId,
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

    await incrementDocumentUsage(workspaceId);
    return [created];
  });

  return getInvoiceWithLines(workspaceId, invoice!.id);
}

async function createInvoiceSnapshot(
  workspaceId: string,
  invoiceId: string,
  reason: string,
  userId?: string,
) {
  const data = await getInvoiceWithLines(workspaceId, invoiceId);
  if (!data) return;

  await db.insert(invoiceSnapshots).values({
    invoiceId,
    workspaceId,
    snapshot: data,
    reason,
    createdByUserId: userId,
  });
}

export async function performInvoiceAction(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  invoiceId: string,
  action: {
    action: string;
    amountMinor?: number;
    label?: string;
    paidAt?: string;
    method?: string;
    reference?: string;
    notes?: string;
    toEmail?: string;
    subject?: string;
    message?: string;
  },
  userId: string,
) {
  const data = await getInvoiceWithLines(workspaceId, invoiceId);
  if (!data) throw new Error("NotFound");

  const { invoice } = data;
  const now = new Date();
  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);

  switch (action.action) {
    case "send": {
      if (invoice.status !== "draft") {
        throw new Error("Only draft invoices can be sent.");
      }
      const invoiceNumber = await allocateInvoiceNumber(
        invoice.businessProfileId,
        workspaceId,
      );
      await db
        .update(invoices)
        .set({
          status: "sent",
          invoiceNumber,
          sentAt: now,
          publicToken: generateUrlSafeToken(32),
          updatedAt: now,
        })
        .where(eq(invoices.id, invoiceId));
      await createInvoiceSnapshot(workspaceId, invoiceId, "issued", userId);
      break;
    }
    case "mark_paid": {
      await db
        .update(invoices)
        .set({
          status: "paid",
          amountPaidMinor: invoice.grandTotalMinor,
          paidAt: now,
          updatedAt: now,
        })
        .where(eq(invoices.id, invoiceId));
      break;
    }
    case "mark_partial": {
      if (invoice.amountPaidMinor <= 0) {
        throw new Error("Record a payment before marking as partially paid.");
      }
      await db
        .update(invoices)
        .set({ status: "partially_paid", updatedAt: now })
        .where(eq(invoices.id, invoiceId));
      break;
    }
    case "add_payment": {
      const amountMinor = action.amountMinor!;
      await db.insert(paymentRecords).values({
        workspaceId,
        invoiceId,
        amountMinor,
        currency: invoice.currency,
        paidAt: action.paidAt ? new Date(action.paidAt) : now,
        method: action.method ?? action.label,
        reference: action.reference,
        notes: action.notes,
        isUserEntered: true,
        createdByUserId: userId,
      });

      const newPaid = invoice.amountPaidMinor + amountMinor;
      const balance = outstandingBalance(invoice.grandTotalMinor, newPaid);
      const newStatus =
        balance === 0 ? "paid" : newPaid > 0 ? "partially_paid" : invoice.status;

      await db
        .update(invoices)
        .set({
          amountPaidMinor: newPaid,
          status: newStatus as typeof invoice.status,
          paidAt: balance === 0 ? now : invoice.paidAt,
          updatedAt: now,
        })
        .where(eq(invoices.id, invoiceId));
      break;
    }
    case "void": {
      await db
        .update(invoices)
        .set({ status: "void", voidedAt: now, updatedAt: now })
        .where(eq(invoices.id, invoiceId));
      break;
    }
    case "archive": {
      await db
        .update(invoices)
        .set({ status: "archived", archivedAt: now, updatedAt: now })
        .where(eq(invoices.id, invoiceId));
      break;
    }
    case "restore": {
      await db
        .update(invoices)
        .set({ status: "sent", archivedAt: null, updatedAt: now })
        .where(eq(invoices.id, invoiceId));
      break;
    }
    case "delete": {
      if (invoice.status !== "draft") {
        throw new Error("Only draft invoices can be deleted.");
      }
      await db.delete(invoices).where(eq(invoices.id, invoiceId));
      break;
    }
    case "duplicate": {
      const usage = await getUsageForPeriod(workspaceId);
      assertDocumentCapacity(
        planId,
        usage.documentsCreated,
        subscriptionStatus,
      );
      const copy = await createDraftInvoice(
        workspaceId,
        planId,
        {
          clientId: invoice.clientId,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          currency: invoice.currency,
          customerReference: invoice.customerReference ?? undefined,
          notes: invoice.notes ?? undefined,
          paymentInstructions: invoice.paymentInstructions ?? undefined,
          terms: invoice.terms ?? undefined,
          footerNote: invoice.footerNote ?? undefined,
          template: invoice.template,
          accentColour: invoice.accentColour ?? undefined,
          pricesInclusiveOfTax: invoice.pricesInclusiveOfTax,
          shippingMinor: invoice.shippingMinor,
          lineItems: data.lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unit: line.unit,
            unitPriceMinor: line.unitPriceMinor,
            discountMinor: line.discountMinor,
            taxRatePercent: line.taxRatePercent,
            catalogueItemId: line.catalogueItemId,
          })),
        },
        userId,
      );
      return copy;
    }
    case "email": {
      if (!canEmailDocuments(planId, subscriptionStatus)) {
        throw new Error("Email sending requires a Starter plan or higher.");
      }
      const { sendInvoiceEmail } = await import("@/lib/email/document-emails");
      return sendInvoiceEmail({
        workspaceId,
        planId,
        invoiceId,
        userId,
        toEmail: action.toEmail,
        subject: action.subject,
        message: action.message,
      });
    }
    default:
      throw new Error("Unknown action.");
  }

  return getInvoiceWithLines(workspaceId, invoiceId);
}
