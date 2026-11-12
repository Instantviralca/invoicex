import { requireAppContext } from "@/lib/app-context";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { getPaymentReturnStatus } from "@/lib/mollie/subscriptions";

export async function GET() {
  try {
    const { membership } = await requireAppContext();
    const result = await getPaymentReturnStatus(membership.workspaceId);
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
