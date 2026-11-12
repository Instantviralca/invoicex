import { calculateDocumentTotals } from "@/lib/money";
import type { LineItemInput } from "@/lib/validations/common";

export function computeLineItemsWithTotals(
  lineItems: LineItemInput[],
  options: { shippingMinor?: number; pricesInclusiveOfTax?: boolean },
) {
  const totals = calculateDocumentTotals(
    lineItems.map((line) => ({
      quantity: line.quantity,
      unitPriceMinor: line.unitPriceMinor,
      discountMinor: line.discountMinor ?? 0,
      taxRatePercent: line.taxRatePercent,
    })),
    {
      shippingMinor: options.shippingMinor ?? 0,
      pricesInclusiveOfTax: options.pricesInclusiveOfTax ?? false,
    },
  );

  const enrichedLines = lineItems.map((line, index) => ({
    ...line,
    position: line.position ?? index,
    lineSubtotalMinor: totals.lineTotals[index]!.lineSubtotalMinor,
    lineTaxMinor: totals.lineTotals[index]!.lineTaxMinor,
    lineTotalMinor: totals.lineTotals[index]!.lineTotalMinor,
    discountMinor: line.discountMinor ?? 0,
  }));

  return { totals, enrichedLines };
}

export function clientAddressSnapshot(client: {
  billingAddressLine1?: string | null;
  billingAddressLine2?: string | null;
  billingCity?: string | null;
  billingRegion?: string | null;
  billingPostcode?: string | null;
  billingCountry?: string | null;
  contactName: string;
  businessName?: string | null;
}) {
  return {
    contactName: client.contactName,
    businessName: client.businessName,
    line1: client.billingAddressLine1,
    line2: client.billingAddressLine2,
    city: client.billingCity,
    region: client.billingRegion,
    postcode: client.billingPostcode,
    country: client.billingCountry ?? "GB",
  };
}
