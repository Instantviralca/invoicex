import { addDays, addMonths, addWeeks, addYears, formatISO } from "date-fns";

export type RecurringFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annually"
  | "custom";

/**
 * Pure next-run calculation for recurring invoices.
 */
export function calculateNextRunDate(
  fromDate: Date,
  frequency: RecurringFrequency,
  customIntervalDays?: number | null,
): Date {
  switch (frequency) {
    case "weekly":
      return addWeeks(fromDate, 1);
    case "monthly":
      return addMonths(fromDate, 1);
    case "quarterly":
      return addMonths(fromDate, 3);
    case "semiannual":
      return addMonths(fromDate, 6);
    case "annually":
      return addYears(fromDate, 1);
    case "custom": {
      const days =
        customIntervalDays && customIntervalDays > 0 ? customIntervalDays : 30;
      return addDays(fromDate, days);
    }
    default:
      return addMonths(fromDate, 1);
  }
}

export function recurringRunKey(scheduleId: string, runDate: Date | string): string {
  const iso =
    typeof runDate === "string"
      ? runDate.slice(0, 10)
      : formatISO(runDate, { representation: "date" });
  return `${scheduleId}:${iso}`;
}

export function mapMolliePaymentStatus(
  status: string,
): "pending" | "paid" | "failed" | "canceled" | "expired" | "unknown" {
  switch (status) {
    case "open":
    case "pending":
    case "authorized":
      return "pending";
    case "paid":
      return "paid";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    case "expired":
      return "expired";
    default:
      return "unknown";
  }
}

export function mapMollieSubscriptionStatus(
  status: string,
): "active" | "pending" | "cancelled" | "suspended" | "completed" | "unknown" {
  switch (status) {
    case "active":
      return "active";
    case "pending":
      return "pending";
    case "canceled":
      return "cancelled";
    case "suspended":
      return "suspended";
    case "completed":
      return "completed";
    default:
      return "unknown";
  }
}
