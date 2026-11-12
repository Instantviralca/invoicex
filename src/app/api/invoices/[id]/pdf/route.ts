import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles } from "@/db/schema";
import { requireAppContext } from "@/lib/app-context";
import { handleApiError } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { canRemoveBranding } from "@/lib/entitlements";
import {
  buildAddressLines,
  generateDocumentPdf,
  pdfFilename,
} from "@/lib/pdf/generate-document-pdf";
import { getInvoiceWithLines } from "@/lib/services/invoices";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:read");
    const { id } = await context.params;

    const data = await getInvoiceWithLines(membership.workspaceId, id);
    if (!data) return handleApiError(new Error("NotFound"));

    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.id, data.invoice.businessProfileId))
      .limit(1);

    const snapshot = (data.invoice.billingAddressSnapshot ?? {}) as Record<string, string>;

    const pdf = await generateDocumentPdf({
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
      showBranding: !canRemoveBranding(membership.workspace.planId),
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdfFilename("invoice", data.invoice.invoiceNumber)}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
