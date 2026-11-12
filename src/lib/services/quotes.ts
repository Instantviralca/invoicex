import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  businessProfiles,
  clients,
  quoteLineItems,
  quotePublicTokens,
  quoteResponses,
  quoteSnapshots,
  quotes,
} from "@/db/schema";
import { getWorkspaceSubscriptionStatus } from "@/lib/billing/access";
import {
  assertDocumentCapacity,
  assertTemplateAccess,
  canEmailDocuments,
} from "@/lib/entitlements";
import { deriveQuoteStatus } from "@/lib/document-status";
import { generateUrlSafeToken } from "@/lib/crypto";
import { allocateQuoteNumber } from "@/lib/numbering";
import {
  clientAddressSnapshot,
  computeLineItemsWithTotals,
} from "@/lib/services/documents-shared";
import { createDraftInvoice } from "@/lib/services/invoices";
import { getUsageForPeriod, incrementDocumentUsage } from "@/lib/services/usage";
import type { QuoteFormValues } from "@/lib/validations/quotes";

export async function listQuotes(
  workspaceId: string,
  options: {
    page: number;
    pageSize: number;
    q?: string;
    status?: string;
    order: "asc" | "desc";
  },
) {
  const conditions = [eq(quotes.workspaceId, workspaceId)];

  if (options.q) {
    const term = `%${options.q}%`;
    conditions.push(ilike(quotes.quoteNumber, term));
  }

  const where = and(...conditions);

  const rows = await db
    .select({
      quote: quotes,
      clientName: clients.contactName,
      businessName: clients.businessName,
    })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .where(where)
    .orderBy(desc(quotes.updatedAt))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);

  const [totalRow] = await db
    .select({ count: count() })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .where(where);

  const items = rows
    .map(({ quote, clientName, businessName }) => ({
      ...quote,
      clientName: businessName ?? clientName,
      derivedStatus: deriveQuoteStatus({
        baseStatus: quote.status,
        validUntil: quote.validUntil,
      }),
    }))
    .filter((item) => (options.status ? item.derivedStatus === options.status : true));

  return {
    items,
    total: totalRow?.count ?? 0,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getQuoteWithLines(workspaceId: string, quoteId: string) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.id, quoteId), eq(quotes.workspaceId, workspaceId)))
    .limit(1);

  if (!quote) return null;

  const lines = await db
    .select()
    .from(quoteLineItems)
    .where(eq(quoteLineItems.quoteId, quoteId))
    .orderBy(quoteLineItems.position);

  const [client] = await db
    .select()
    .from(clients)
    .where(eq(clients.id, quote.clientId))
    .limit(1);

  return { quote, lines, client };
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

export async function createDraftQuote(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  values: QuoteFormValues,
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
    const existing = await getQuoteWithLines(workspaceId, existingId);
    if (!existing || existing.quote.status !== "draft") {
      throw new Error("Only draft quotes can be updated.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(quotes)
        .set({
          clientId: values.clientId,
          issueDate: values.issueDate,
          validUntil: values.validUntil,
          currency: values.currency,
          customerReference: values.customerReference,
          notes: values.notes,
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
        .where(eq(quotes.id, existingId));

      await tx.delete(quoteLineItems).where(eq(quoteLineItems.quoteId, existingId));

      if (enrichedLines.length) {
        await tx.insert(quoteLineItems).values(
          enrichedLines.map((line) => ({
            quoteId: existingId,
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

    return getQuoteWithLines(workspaceId, existingId);
  }

  const usage = await getUsageForPeriod(workspaceId);
  assertDocumentCapacity(planId, usage.documentsCreated, subscriptionStatus);

  const draftNumber = `DRAFT-${Date.now()}`;

  const [quote] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(quotes)
      .values({
        workspaceId,
        businessProfileId: profile.id,
        clientId: values.clientId,
        quoteNumber: draftNumber,
        status: "draft",
        issueDate: values.issueDate,
        validUntil: values.validUntil,
        currency: values.currency,
        customerReference: values.customerReference,
        notes: values.notes ?? profile.defaultQuoteNotes,
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

    if (!created) throw new Error("Failed to create quote.");

    if (enrichedLines.length) {
      await tx.insert(quoteLineItems).values(
        enrichedLines.map((line) => ({
          quoteId: created.id,
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

  return getQuoteWithLines(workspaceId, quote!.id);
}

async function createQuoteSnapshot(
  workspaceId: string,
  quoteId: string,
  reason: string,
) {
  const data = await getQuoteWithLines(workspaceId, quoteId);
  if (!data) return;

  await db.insert(quoteSnapshots).values({
    quoteId,
    workspaceId,
    snapshot: data,
    reason,
  });
}

export async function performQuoteAction(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  quoteId: string,
  action: {
    action: string;
    toEmail?: string;
    subject?: string;
    message?: string;
  },
  userId: string,
) {
  const data = await getQuoteWithLines(workspaceId, quoteId);
  if (!data) throw new Error("NotFound");

  const { quote } = data;
  const now = new Date();
  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);

  switch (action.action) {
    case "send": {
      if (quote.status !== "draft") {
        throw new Error("Only draft quotes can be sent.");
      }
      const quoteNumber = await allocateQuoteNumber(
        quote.businessProfileId,
        workspaceId,
      );
      await db
        .update(quotes)
        .set({
          status: "sent",
          quoteNumber,
          sentAt: now,
          updatedAt: now,
        })
        .where(eq(quotes.id, quoteId));
      await createQuoteSnapshot(workspaceId, quoteId, "issued");
      break;
    }
    case "archive": {
      await db
        .update(quotes)
        .set({ status: "archived", archivedAt: now, updatedAt: now })
        .where(eq(quotes.id, quoteId));
      break;
    }
    case "restore": {
      await db
        .update(quotes)
        .set({ status: "sent", archivedAt: null, updatedAt: now })
        .where(eq(quotes.id, quoteId));
      break;
    }
    case "delete": {
      if (quote.status !== "draft") {
        throw new Error("Only draft quotes can be deleted.");
      }
      await db.delete(quotes).where(eq(quotes.id, quoteId));
      break;
    }
    case "duplicate": {
      const usage = await getUsageForPeriod(workspaceId);
      assertDocumentCapacity(
        planId,
        usage.documentsCreated,
        subscriptionStatus,
      );
      return createDraftQuote(
        workspaceId,
        planId,
        {
          clientId: quote.clientId,
          issueDate: quote.issueDate,
          validUntil: quote.validUntil,
          currency: quote.currency,
          customerReference: quote.customerReference ?? undefined,
          notes: quote.notes ?? undefined,
          terms: quote.terms ?? undefined,
          footerNote: quote.footerNote ?? undefined,
          template: quote.template,
          accentColour: quote.accentColour ?? undefined,
          pricesInclusiveOfTax: quote.pricesInclusiveOfTax,
          shippingMinor: quote.shippingMinor,
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
    }
    case "convert": {
      const invoice = await createDraftInvoice(
        workspaceId,
        planId,
        {
          clientId: quote.clientId,
          issueDate: quote.issueDate,
          dueDate: quote.validUntil,
          currency: quote.currency,
          customerReference: quote.customerReference ?? undefined,
          notes: quote.notes ?? undefined,
          terms: quote.terms ?? undefined,
          footerNote: quote.footerNote ?? undefined,
          template: quote.template,
          accentColour: quote.accentColour ?? undefined,
          pricesInclusiveOfTax: quote.pricesInclusiveOfTax,
          shippingMinor: quote.shippingMinor,
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

      await db
        .update(quotes)
        .set({
          status: "converted",
          convertedAt: now,
          convertedInvoiceId: invoice?.invoice.id,
          updatedAt: now,
        })
        .where(eq(quotes.id, quoteId));

      return invoice;
    }
    case "generate_public_link": {
      const token = generateUrlSafeToken(48);
      await db.insert(quotePublicTokens).values({
        quoteId,
        workspaceId,
        token,
      });
      return { token };
    }
    case "email": {
      if (!canEmailDocuments(planId, subscriptionStatus)) {
        throw new Error("Email sending requires a Starter plan or higher.");
      }
      const { sendQuoteEmail } = await import("@/lib/email/document-emails");
      return sendQuoteEmail({
        workspaceId,
        planId,
        quoteId,
        userId,
        toEmail: action.toEmail,
        subject: action.subject,
        message: action.message,
      });
    }
    default:
      throw new Error("Unknown action.");
  }

  return getQuoteWithLines(workspaceId, quoteId);
}

export async function getQuoteByPublicToken(token: string) {
  const [row] = await db
    .select({
      token: quotePublicTokens,
      quote: quotes,
    })
    .from(quotePublicTokens)
    .innerJoin(quotes, eq(quotes.id, quotePublicTokens.quoteId))
    .where(
      and(
        eq(quotePublicTokens.token, token),
        sql`${quotePublicTokens.revokedAt} IS NULL`,
      ),
    )
    .limit(1);

  if (!row) return null;

  if (row.token.expiresAt && row.token.expiresAt < new Date()) {
    return null;
  }

  const lines = await db
    .select()
    .from(quoteLineItems)
    .where(eq(quoteLineItems.quoteId, row.quote.id))
    .orderBy(quoteLineItems.position);

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, row.quote.businessProfileId))
    .limit(1);

  return { quote: row.quote, lines, profile };
}

export async function recordQuoteResponse(
  token: string,
  input: { action: "accept" | "reject"; respondentName: string; comment?: string },
  meta?: { ipHash?: string; userAgent?: string },
) {
  const data = await getQuoteByPublicToken(token);
  if (!data) throw new Error("NotFound");

  const now = new Date();

  await db.insert(quoteResponses).values({
    quoteId: data.quote.id,
    workspaceId: data.quote.workspaceId,
    action: input.action,
    respondentName: input.respondentName,
    comment: input.comment,
    ipHash: meta?.ipHash,
    userAgent: meta?.userAgent,
  });

  await db
    .update(quotes)
    .set({
      status: input.action === "accept" ? "accepted" : "rejected",
      acceptedAt: input.action === "accept" ? now : data.quote.acceptedAt,
      rejectedAt: input.action === "reject" ? now : data.quote.rejectedAt,
      updatedAt: now,
    })
    .where(eq(quotes.id, data.quote.id));

  const [owner] = await db
    .select({ email: businessProfiles.email, tradingName: businessProfiles.tradingName })
    .from(businessProfiles)
    .where(eq(businessProfiles.id, data.quote.businessProfileId))
    .limit(1);

  if (owner?.email) {
    const { sendEmail } = await import("@/lib/email/send");
    const clientName =
      (data.quote.billingAddressSnapshot as { businessName?: string; contactName?: string } | null)
        ?.businessName ??
      (data.quote.billingAddressSnapshot as { contactName?: string } | null)?.contactName ??
      "Client";

    await sendEmail({
      to: owner.email,
      subject:
        input.action === "accept"
          ? `Quote ${data.quote.quoteNumber} accepted`
          : `Quote ${data.quote.quoteNumber} declined`,
      template: input.action === "accept" ? "quote-accepted" : "quote-rejected",
      templateProps: {
        quoteNumber: data.quote.quoteNumber,
        clientName,
        respondentName: input.respondentName,
        comment: input.comment,
      },
      workspaceId: data.quote.workspaceId,
      relatedType: "quote",
      relatedId: data.quote.id,
    });
  }

  return data;
}
