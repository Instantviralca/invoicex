import { handleApiError } from "@/lib/api/response";
import { canRemoveBranding } from "@/lib/entitlements";
import {
  buildAddressLines,
  generateDocumentPdf,
  pdfFilename,
} from "@/lib/pdf/generate-document-pdf";
import { getQuoteByPublicToken } from "@/lib/services/quotes";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { workspaces } from "@/db/schema";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const data = await getQuoteByPublicToken(token);
    if (!data) return handleApiError(new Error("NotFound"));

    const [workspace] = await db
      .select({ planId: workspaces.planId })
      .from(workspaces)
      .where(eq(workspaces.id, data.quote.workspaceId))
      .limit(1);

    const snapshot = (data.quote.billingAddressSnapshot ?? {}) as Record<string, string>;

    const pdf = await generateDocumentPdf({
      type: "quote",
      number: data.quote.quoteNumber,
      issueDate: data.quote.issueDate,
      dueOrValidDate: data.quote.validUntil,
      dueOrValidLabel: "Valid until",
      template: data.quote.template,
      accentColour: data.quote.accentColour ?? data.profile?.accentColour ?? "#1D4ED8",
      currency: data.quote.currency,
      business: {
        tradingName: data.profile?.tradingName ?? "Business",
        addressLines: buildAddressLines({
          line1: data.profile?.addressLine1,
          line2: data.profile?.addressLine2,
          city: data.profile?.city,
          region: data.profile?.region,
          postcode: data.profile?.postcode,
          country: data.profile?.country,
        }),
        email: data.profile?.email,
        telephone: data.profile?.telephone,
        vatNumber: data.profile?.vatNumber,
      },
      client: {
        name: snapshot.businessName ?? snapshot.contactName ?? "Client",
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
      showBranding: !canRemoveBranding(workspace?.planId ?? "free"),
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
