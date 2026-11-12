import { addDays, differenceInCalendarDays, isBefore, startOfDay } from "date-fns";

export type PaymentDerivedStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "due_soon"
  | "overdue"
  | "void"
  | "archived";

/**
 * Derive display status from due date and payment state.
 * Due Soon / Overdue are never manually set — they are computed.
 */
export function deriveInvoiceStatus(input: {
  baseStatus: string;
  dueDate: Date | string;
  amountPaidMinor: number;
  grandTotalMinor: number;
  dueSoonDays?: number;
  now?: Date;
}): PaymentDerivedStatus {
  const base = input.baseStatus;
  if (base === "draft") return "draft";
  if (base === "void") return "void";
  if (base === "archived") return "archived";
  if (base === "paid" || input.amountPaidMinor >= input.grandTotalMinor) {
    return "paid";
  }
  if (input.amountPaidMinor > 0) {
    // Still check overdue for partially paid
    const due = startOfDay(new Date(input.dueDate));
    const now = startOfDay(input.now ?? new Date());
    if (isBefore(due, now)) return "overdue";
    return "partially_paid";
  }

  const due = startOfDay(new Date(input.dueDate));
  const now = startOfDay(input.now ?? new Date());
  const dueSoonDays = input.dueSoonDays ?? 7;

  if (isBefore(due, now)) return "overdue";
  const daysUntilDue = differenceInCalendarDays(due, now);
  if (daysUntilDue <= dueSoonDays) return "due_soon";

  if (base === "viewed") return "viewed";
  if (base === "sent") return "sent";
  return (base as PaymentDerivedStatus) || "sent";
}

export function dueDateFromPreset(
  issueDate: Date,
  preset: "immediate" | "net7" | "net14" | "net30" | "net60",
): Date {
  const days =
    preset === "immediate"
      ? 0
      : preset === "net7"
        ? 7
        : preset === "net14"
          ? 14
          : preset === "net30"
            ? 30
            : 60;
  return addDays(issueDate, days);
}

export const invoiceStatusLabels: Record<PaymentDerivedStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  partially_paid: "Partially Paid",
  paid: "Paid",
  due_soon: "Due Soon",
  overdue: "Overdue",
  void: "Void",
  archived: "Archived",
};

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted"
  | "archived";

export function deriveQuoteStatus(input: {
  baseStatus: string;
  validUntil: Date | string;
  now?: Date;
}): QuoteStatus {
  const base = input.baseStatus as QuoteStatus;
  if (
    ["draft", "accepted", "rejected", "converted", "archived"].includes(base)
  ) {
    return base;
  }
  const validUntil = startOfDay(new Date(input.validUntil));
  const now = startOfDay(input.now ?? new Date());
  if (isBefore(validUntil, now)) return "expired";
  return base;
}

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  converted: "Converted",
  archived: "Archived",
};
