import { requireAppContext } from "@/lib/app-context";
import { handleApiError } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { canRemoveBranding } from "@/lib/entitlements";
import {
  buildAddressLines,
  generateDocumentPdf,
  pdfFilename,
} from "@/lib/pdf/generate-document-pdf";
import { getQuoteWithLines } from "@/lib/services/quotes";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles } from "@/db/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "quotes:read");
    const { id } = await context.params;

    const data = await getQuoteWithLines(membership.workspaceId, id);
    if (!data) return handleApiError(new Error("NotFound"));

    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, data.quote.businessProfileId))
      .limit(1);

    const snapshot = (data.quote.billingAddressSnapshot ?? {}) as Record<string, string>;

    const pdf = await generateDocumentPdf({
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
      showBranding: !canRemoveBranding(membership.workspace.planId),
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename("quote", data.quote.quoteNumber)}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
