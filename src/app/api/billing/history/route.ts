import { requireAppContext } from "@/lib/app-context";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { getBillingHistory } from "@/lib/mollie/subscriptions";
import { assertPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "billing:manage");

    const payments = await getBillingHistory(membership.workspaceId);

    return jsonOk({ payments });
  } catch (error) {
    return handleApiError(error);
  }
}
