import { requireAppContext } from "@/lib/app-context";
import { handleApiError, jsonOk } from "@/lib/api/response";
import {
  billingStatusLabel,
  formatBillingDate,
  intervalLabel,
  planDisplayName,
} from "@/lib/billing/access";
import { syncSubscriptionStatus } from "@/lib/mollie/subscriptions";
import { assertPermission } from "@/lib/permissions";

export async function POST() {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "billing:manage");

    const subscription = await syncSubscriptionStatus(membership.workspaceId);

    return jsonOk({
      subscription: {
        planId: subscription.planId,
        planName: planDisplayName(subscription.planId),
        interval: subscription.interval,
        intervalLabel: intervalLabel(subscription.interval),
        status: subscription.status,
        statusLabel: billingStatusLabel(subscription.status),
        currentPeriodStart: formatBillingDate(subscription.currentPeriodStart),
        currentPeriodEnd: formatBillingDate(subscription.currentPeriodEnd),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        pendingPlanId: subscription.pendingPlanId,
        pendingInterval: subscription.pendingInterval,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
