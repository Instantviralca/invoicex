import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

/** Money stored and calculated in minor units (pence/cents) as integers. */
export type MoneyMinor = number;

export function poundsToMinor(pounds: string | number): MoneyMinor {
  const d = new Decimal(pounds);
  return d.mul(100).round().toNumber();
}

export function minorToPounds(minor: MoneyMinor): string {
  return new Decimal(minor).div(100).toFixed(2);
}

export function formatMoney(
  minor: MoneyMinor,
  currency: string = "GBP",
  locale: string = "en-GB",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(new Decimal(minor).div(100).toNumber());
}

export type LineItemInput = {
  quantity: string | number;
  unitPriceMinor: MoneyMinor;
  discountMinor?: MoneyMinor;
  taxRatePercent: string | number; // e.g. 20 for 20%
};

export type DocumentTotals = {
  subtotalMinor: MoneyMinor;
  discountTotalMinor: MoneyMinor;
  taxTotalMinor: MoneyMinor;
  shippingMinor: MoneyMinor;
  grandTotalMinor: MoneyMinor;
  lineTotals: Array<{
    lineSubtotalMinor: MoneyMinor;
    lineDiscountMinor: MoneyMinor;
    lineTaxMinor: MoneyMinor;
    lineTotalMinor: MoneyMinor;
  }>;
};

/**
 * Authoritative monetary calculation for invoices and quotes.
 * Tax is calculated on (qty * unitPrice - lineDiscount) unless pricesInclusive.
 */
export function calculateDocumentTotals(
  lines: LineItemInput[],
  options: {
    shippingMinor?: MoneyMinor;
    pricesInclusiveOfTax?: boolean;
  } = {},
): DocumentTotals {
  const shippingMinor = options.shippingMinor ?? 0;
  const inclusive = options.pricesInclusiveOfTax ?? false;

  let subtotalMinor = new Decimal(0);
  let discountTotalMinor = new Decimal(0);
  let taxTotalMinor = new Decimal(0);

  const lineTotals = lines.map((line) => {
    const qty = new Decimal(line.quantity);
    const unit = new Decimal(line.unitPriceMinor);
    const discount = new Decimal(line.discountMinor ?? 0);
    const rate = new Decimal(line.taxRatePercent).div(100);

    const gross = qty.mul(unit);
    const afterDiscount = Decimal.max(gross.minus(discount), 0);

    let lineTax: Decimal;
    let lineNet: Decimal;

    if (inclusive && rate.gt(0)) {
      // Extract tax from inclusive amount
      lineNet = afterDiscount.div(rate.plus(1));
      lineTax = afterDiscount.minus(lineNet);
    } else {
      lineNet = afterDiscount;
      lineTax = afterDiscount.mul(rate);
    }

    const lineTaxRounded = lineTax.round();
    const lineNetRounded = lineNet.round();
    const lineDiscountRounded = discount.round();
    const lineTotalRounded = inclusive
      ? afterDiscount.round()
      : lineNetRounded.plus(lineTaxRounded);

    subtotalMinor = subtotalMinor.plus(lineNetRounded);
    discountTotalMinor = discountTotalMinor.plus(lineDiscountRounded);
    taxTotalMinor = taxTotalMinor.plus(lineTaxRounded);

    return {
      lineSubtotalMinor: lineNetRounded.toNumber(),
      lineDiscountMinor: lineDiscountRounded.toNumber(),
      lineTaxMinor: lineTaxRounded.toNumber(),
      lineTotalMinor: lineTotalRounded.toNumber(),
    };
  });

  const shipping = new Decimal(shippingMinor);
  const grandTotalMinor = subtotalMinor
    .plus(taxTotalMinor)
    .plus(shipping)
    .round()
    .toNumber();

  return {
    subtotalMinor: subtotalMinor.round().toNumber(),
    discountTotalMinor: discountTotalMinor.round().toNumber(),
    taxTotalMinor: taxTotalMinor.round().toNumber(),
    shippingMinor: shipping.round().toNumber(),
    grandTotalMinor,
    lineTotals,
  };
}

export function outstandingBalance(
  grandTotalMinor: MoneyMinor,
  amountPaidMinor: MoneyMinor,
): MoneyMinor {
  return Math.max(
    new Decimal(grandTotalMinor).minus(amountPaidMinor).round().toNumber(),
    0,
  );
}
