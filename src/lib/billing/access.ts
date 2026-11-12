import {
  type BillingInterval,
  type PlanId,
  plans,
} from "@/config/brand";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import type { subscriptionStatusEnum } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { WorkspaceMember } from "@/lib/workspace";

export type SubscriptionStatus =
  (typeof subscriptionStatusEnum.enumValues)[number];

export type BillingSnapshot = {
  planId: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  pendingPlanId: PlanId | null;
  pendingInterval: BillingInterval | null;
};

/**
 * Plan limits used for new actions (document/client caps, etc.).
 * On past_due we fall back to Free limits for new usage while keeping existing data.
 */
export function resolveLimitsPlanId(
  planId: PlanId,
  status: SubscriptionStatus,
): PlanId {
  if (planId === "free") {
    return "free";
  }

  if (status === "past_due" || status === "pending" || status === "expired") {
    return "free";
  }

  return planId;
}

/** Whether paid feature flags (email, recurring, reports, etc.) should be honoured. */
export function canAccessPaidFeatures(
  planId: PlanId,
  status: SubscriptionStatus,
): boolean {
  if (planId === "free") {
    return true;
  }

  if (status === "active" || status === "trialing") {
    return true;
  }

  // Cancelled subscriptions retain access until the period ends (reconciliation downgrades later).
  if (status === "cancelled") {
    return true;
  }

  return false;
}

export function billingStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "pending":
      return "Pending payment";
    case "past_due":
      return "Payment overdue";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    case "trialing":
      return "Trial";
    default:
      return status;
  }
}

export function intervalLabel(interval: BillingInterval): string {
  return interval === "year" ? "Annual" : "Monthly";
}

export function formatBillingDate(date: Date | null | undefined): string {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function planDisplayName(planId: PlanId): string {
  return plans[planId].name;
}

export function membershipSubscriptionStatus(
  membership: Pick<WorkspaceMember, "subscription">,
): SubscriptionStatus {
  return membership.subscription?.status ?? "active";
}

export async function getWorkspaceSubscriptionStatus(
  workspaceId: string,
): Promise<SubscriptionStatus> {
  const [row] = await db
    .select({ status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .limit(1);

  return row?.status ?? "active";
}
