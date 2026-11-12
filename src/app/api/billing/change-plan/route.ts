import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import {
  formatBillingDate,
  intervalLabel,
  planDisplayName,
} from "@/lib/billing/access";
import { changePlan } from "@/lib/mollie/subscriptions";
import { assertPermission } from "@/lib/permissions";

const changePlanSchema = z.object({
  planId: z.enum(["starter", "pro", "business"]),
  interval: z.enum(["month", "year"]),
});

export async function POST(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "billing:manage");

    const body = await parseJsonBody(request, changePlanSchema);

    const result = await changePlan({
      workspaceId: membership.workspaceId,
      planId: body.planId,
      interval: body.interval,
    });

    return jsonOk({
      message: result.policy,
      policy: result.policy,
      effectiveDate: formatBillingDate(result.effectiveDate),
      currentPlan: {
        planId: membership.subscription?.planId ?? membership.workspace.planId,
        planName: planDisplayName(result.subscription.planId),
        interval: result.subscription.interval,
        intervalLabel: intervalLabel(result.subscription.interval),
      },
      scheduledPlan: {
        planId: body.planId,
        planName: planDisplayName(body.planId),
        interval: body.interval,
        intervalLabel: intervalLabel(body.interval),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
