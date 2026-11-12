import { requireAppContext } from "@/lib/app-context";
import { handleApiError, jsonOk } from "@/lib/api/response";
import {
  billingStatusLabel,
  formatBillingDate,
  planDisplayName,
} from "@/lib/billing/access";
import { cancelSubscription } from "@/lib/mollie/subscriptions";
import { assertPermission } from "@/lib/permissions";

export async function POST() {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "billing:manage");

    const subscription = await cancelSubscription(membership.workspaceId);

    return jsonOk({
      message:
        "Your subscription has been cancelled. You will retain access until the end of the current billing period.",
      subscription: {
        planId: subscription.planId,
        planName: planDisplayName(subscription.planId),
        status: subscription.status,
        statusLabel: billingStatusLabel(subscription.status),
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        accessUntil: formatBillingDate(subscription.currentPeriodEnd),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
