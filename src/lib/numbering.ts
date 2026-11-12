import {
  and,
  eq,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, invoices, quotes } from "@/db/schema";

/**
 * Atomically allocate the next invoice number for a business profile.
 * Uses a single UPDATE ... RETURNING to prevent duplicates under concurrency.
 */
export async function allocateInvoiceNumber(
  businessProfileId: string,
  workspaceId: string,
): Promise<string> {
  const updated = await db
    .update(businessProfiles)
    .set({
      nextInvoiceNumber: sql`${businessProfiles.nextInvoiceNumber} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(businessProfiles.id, businessProfileId),
        eq(businessProfiles.workspaceId, workspaceId),
      ),
    )
    .returning({
      prefix: businessProfiles.invoicePrefix,
      next: businessProfiles.nextInvoiceNumber,
    });

  if (!updated[0]) {
    throw new Error("Business profile not found for invoice numbering");
  }

  // next is already incremented; the allocated number is next - 1
  const allocated = updated[0].next - 1;
  return `${updated[0].prefix}${String(allocated).padStart(6, "0")}`;
}

export async function allocateQuoteNumber(
  businessProfileId: string,
  workspaceId: string,
): Promise<string> {
  const updated = await db
    .update(businessProfiles)
    .set({
      nextQuoteNumber: sql`${businessProfiles.nextQuoteNumber} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(businessProfiles.id, businessProfileId),
        eq(businessProfiles.workspaceId, workspaceId),
      ),
    )
    .returning({
      prefix: businessProfiles.quotePrefix,
      next: businessProfiles.nextQuoteNumber,
    });

  if (!updated[0]) {
    throw new Error("Business profile not found for quote numbering");
  }

  const allocated = updated[0].next - 1;
  return `${updated[0].prefix}${String(allocated).padStart(6, "0")}`;
}

export async function invoiceNumberExists(
  workspaceId: string,
  invoiceNumber: string,
) {
  const rows = await db
    .select({ id: invoices.id })
    .from(invoices)
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.invoiceNumber, invoiceNumber),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function quoteNumberExists(
  workspaceId: string,
  quoteNumber: string,
) {
  const rows = await db
    .select({ id: quotes.id })
    .from(quotes)
    .where(
      and(
        eq(quotes.workspaceId, workspaceId),
        eq(quotes.quoteNumber, quoteNumber),
      ),
    )
    .limit(1);
  return rows.length > 0;
}
