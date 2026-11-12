import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles } from "@/db/schema";
import { canRemoveBranding } from "@/lib/entitlements";
import {
  buildAddressLines,
  pdfFilename,
  type PdfDocumentInput,
} from "@/lib/pdf/generate-document-pdf";
import { getInvoiceWithLines } from "@/lib/services/invoices";
import { getQuoteWithLines } from "@/lib/services/quotes";

export async function buildInvoicePdfInput(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  invoiceId: string,
): Promise<{ input: PdfDocumentInput; filename: string } | null> {
  const data = await getInvoiceWithLines(workspaceId, invoiceId);
  if (!data) return null;

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, data.invoice.businessProfileId))
    .limit(1);

  const snapshot = (data.invoice.billingAddressSnapshot ?? {}) as Record<
    string,
    string
  >;

  const input: PdfDocumentInput = {
    type: "invoice",
    number: data.invoice.invoiceNumber,
    issueDate: data.invoice.issueDate,
    dueOrValidDate: data.invoice.dueDate,
    dueOrValidLabel: "Due date",
    template: data.invoice.template,
    accentColour: data.invoice.accentColour ?? profile?.accentColour ?? "#1D4ED8",
    currency: data.invoice.currency,
    business: {
      tradingName: profile?.tradingName ?? "Business",
      addressLines: buildAddressLines({
        line1: profile?.addressLine1,
        line2: profile?.addressLine2,
        city: profile?.city,
        region: profile?.region,
        postcode: profile?.postcode,
        country: profile?.country,
      }),
      email: profile?.email,
      telephone: profile?.telephone,
      vatNumber: profile?.vatNumber,
    },
    client: {
      name: data.client?.businessName ?? data.client?.contactName ?? "Client",
      addressLines: buildAddressLines(snapshot),
    },
    lineItems: data.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: line.lineTotalMinor,
    })),
    subtotalMinor: data.invoice.subtotalMinor,
    taxTotalMinor: data.invoice.taxTotalMinor,
    discountTotalMinor: data.invoice.discountTotalMinor,
    shippingMinor: data.invoice.shippingMinor,
    grandTotalMinor: data.invoice.grandTotalMinor,
    notes: data.invoice.notes,
    terms: data.invoice.terms,
    paymentInstructions: data.invoice.paymentInstructions,
    footerNote: data.invoice.footerNote,
    showBranding: !canRemoveBranding(planId),
  };

  return {
    input,
    filename: pdfFilename("invoice", data.invoice.invoiceNumber),
  };
}

export async function buildQuotePdfInput(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  quoteId: string,
): Promise<{ input: PdfDocumentInput; filename: string } | null> {
  const data = await getQuoteWithLines(workspaceId, quoteId);
  if (!data) return null;

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, data.quote.businessProfileId))
    .limit(1);

  const snapshot = (data.quote.billingAddressSnapshot ?? {}) as Record<
    string,
    string
  >;

  const input: PdfDocumentInput = {
    type: "quote",
    number: data.quote.quoteNumber,
    issueDate: data.quote.issueDate,
    dueOrValidDate: data.quote.validUntil,
    dueOrValidLabel: "Valid until",
    template: data.quote.template,
    accentColour: data.quote.accentColour ?? profile?.accentColour ?? "#1D4ED8",
    currency: data.quote.currency,
    business: {
      tradingName: profile?.tradingName ?? "Business",
      addressLines: buildAddressLines({
        line1: profile?.addressLine1,
        line2: profile?.addressLine2,
        city: profile?.city,
        region: profile?.region,
        postcode: profile?.postcode,
        country: profile?.country,
      }),
      email: profile?.email,
      telephone: profile?.telephone,
      vatNumber: profile?.vatNumber,
    },
    client: {
      name: data.client?.businessName ?? data.client?.contactName ?? "Client",
      addressLines: buildAddressLines(snapshot),
    },
    lineItems: data.lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: line.lineTotalMinor,
    })),
    subtotalMinor: data.quote.subtotalMinor,
    taxTotalMinor: data.quote.taxTotalMinor,
    discountTotalMinor: data.quote.discountTotalMinor,
    shippingMinor: data.quote.shippingMinor,
    grandTotalMinor: data.quote.grandTotalMinor,
    notes: data.quote.notes,
    terms: data.quote.terms,
    footerNote: data.quote.footerNote,
    showBranding: !canRemoveBranding(planId),
  };

  return {
    input,
    filename: pdfFilename("quote", data.quote.quoteNumber),
  };
}
