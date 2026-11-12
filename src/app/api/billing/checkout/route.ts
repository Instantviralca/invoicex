import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { createCheckout } from "@/lib/mollie/subscriptions";
import { assertPermission } from "@/lib/permissions";
import {
  getClientIdentifier,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

const checkoutSchema = z.object({
  planId: z.enum(["starter", "pro", "business"]),
  interval: z.enum(["month", "year"]).default("month"),
});

export async function POST(request: Request) {
  try {
    const clientId = getClientIdentifier(request);
    const limit = rateLimit("checkout", clientId);

    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    const { user, membership } = await requireAppContext();
    assertPermission(membership.role, "billing:manage");

    const body = await parseJsonBody(request, checkoutSchema);

    const result = await createCheckout({
      workspaceId: membership.workspaceId,
      workspaceName: membership.workspace.name,
      ownerEmail: user.email,
      ownerName: user.name,
      planId: body.planId,
      interval: body.interval,
    });

    return jsonOk(
      {
        checkoutUrl: result.checkoutUrl,
        paymentId: result.paymentId,
        planId: result.planId,
        interval: result.interval,
        amountPence: result.amountPence,
      },
      200,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
