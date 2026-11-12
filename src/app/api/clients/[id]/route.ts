import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { getClientById, updateClient } from "@/lib/services/clients";
import { clientFormSchema } from "@/lib/validations/clients";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "clients:read");
    const { id } = await context.params;

    const client = await getClientById(membership.workspaceId, id);
    if (!client) return handleApiError(new Error("NotFound"));

    return jsonOk({ client });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "clients:update");
    const { id } = await context.params;

    const body = await parseJsonBody(request, clientFormSchema);
    const client = await updateClient(membership.workspaceId, id, body);

    return jsonOk({ client });
  } catch (error) {
    return handleApiError(error);
  }
}
