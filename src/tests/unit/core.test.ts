import { describe, expect, it } from "vitest";
import {
  calculateDocumentTotals,
  outstandingBalance,
  poundsToMinor,
  minorToPounds,
} from "@/lib/money";
import { deriveInvoiceStatus, deriveQuoteStatus } from "@/lib/document-status";
import {
  assertDocumentCapacity,
  canEmailDocuments,
  canUseRecurring,
  getPlanLimits,
  PlanLimitError,
} from "@/lib/entitlements";
import { hasPermission } from "@/lib/permissions";
import {
  calculateNextRunDate,
  mapMolliePaymentStatus,
  recurringRunKey,
} from "@/lib/billing-helpers";

describe("money", () => {
  it("converts pounds and minor units safely", () => {
    expect(poundsToMinor("19.99")).toBe(1999);
    expect(minorToPounds(1999)).toBe("19.99");
    expect(poundsToMinor(0.1)).toBe(10);
  });

  it("calculates exclusive tax totals", () => {
    const totals = calculateDocumentTotals(
      [
        {
          quantity: 2,
          unitPriceMinor: 10000,
          discountMinor: 0,
          taxRatePercent: 20,
        },
      ],
      { pricesInclusiveOfTax: false },
    );
    expect(totals.subtotalMinor).toBe(20000);
    expect(totals.taxTotalMinor).toBe(4000);
    expect(totals.grandTotalMinor).toBe(24000);
  });

  it("applies line discounts before tax", () => {
    const totals = calculateDocumentTotals([
      {
        quantity: 1,
        unitPriceMinor: 10000,
        discountMinor: 1000,
        taxRatePercent: 20,
      },
    ]);
    expect(totals.subtotalMinor).toBe(9000);
    expect(totals.taxTotalMinor).toBe(1800);
    expect(totals.grandTotalMinor).toBe(10800);
  });

  it("computes outstanding balances", () => {
    expect(outstandingBalance(10000, 2500)).toBe(7500);
    expect(outstandingBalance(10000, 10000)).toBe(0);
    expect(outstandingBalance(10000, 12000)).toBe(0);
  });
});

describe("document status", () => {
  it("derives overdue and due soon", () => {
    const now = new Date("2026-03-15T12:00:00Z");
    expect(
      deriveInvoiceStatus({
        baseStatus: "sent",
        dueDate: "2026-03-10",
        amountPaidMinor: 0,
        grandTotalMinor: 1000,
        now,
      }),
    ).toBe("overdue");

    expect(
      deriveInvoiceStatus({
        baseStatus: "sent",
        dueDate: "2026-03-18",
        amountPaidMinor: 0,
        grandTotalMinor: 1000,
        now,
      }),
    ).toBe("due_soon");
  });

  it("marks partial and paid correctly", () => {
    expect(
      deriveInvoiceStatus({
        baseStatus: "sent",
        dueDate: "2026-04-01",
        amountPaidMinor: 500,
        grandTotalMinor: 1000,
        now: new Date("2026-03-01"),
      }),
    ).toBe("partially_paid");

    expect(
      deriveInvoiceStatus({
        baseStatus: "sent",
        dueDate: "2026-04-01",
        amountPaidMinor: 1000,
        grandTotalMinor: 1000,
      }),
    ).toBe("paid");
  });

  it("expires quotes past valid-until", () => {
    expect(
      deriveQuoteStatus({
        baseStatus: "sent",
        validUntil: "2026-01-01",
        now: new Date("2026-02-01"),
      }),
    ).toBe("expired");
  });
});

describe("entitlements", () => {
  it("exposes free plan limits", () => {
    expect(getPlanLimits("free").documentsPerMonth).toBe(3);
    expect(canEmailDocuments("free")).toBe(false);
    expect(canUseRecurring("pro")).toBe(true);
  });

  it("throws when document capacity reached", () => {
    expect(() => assertDocumentCapacity("free", 3)).toThrow(PlanLimitError);
  });
});

describe("permissions", () => {
  it("allows owners billing and denies viewers", () => {
    expect(hasPermission("owner", "billing:manage")).toBe(true);
    expect(hasPermission("viewer", "invoices:create")).toBe(false);
    expect(hasPermission("staff", "invoices:create")).toBe(true);
  });
});

describe("billing helpers", () => {
  it("advances recurring dates", () => {
    const start = new Date("2026-01-15T00:00:00Z");
    expect(calculateNextRunDate(start, "monthly").getUTCMonth()).toBe(1);
    expect(calculateNextRunDate(start, "quarterly").getUTCMonth()).toBe(3);
    expect(calculateNextRunDate(start, "custom", 10).getUTCDate()).toBe(25);
  });

  it("builds idempotent run keys", () => {
    expect(recurringRunKey("abc", "2026-03-01")).toBe("abc:2026-03-01");
  });

  it("maps Mollie payment statuses", () => {
    expect(mapMolliePaymentStatus("paid")).toBe("paid");
    expect(mapMolliePaymentStatus("open")).toBe("pending");
    expect(mapMolliePaymentStatus("canceled")).toBe("canceled");
  });
});
