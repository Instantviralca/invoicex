import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { createClient, listClients } from "@/lib/services/clients";
import { clientFormSchema, clientListQuerySchema } from "@/lib/validations/clients";

export async function GET(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "clients:read");

    const url = new URL(request.url);
    const query = clientListQuerySchema.parse(Object.fromEntries(url.searchParams));

    const result = await listClients(membership.workspaceId, query);
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "clients:create");

    const body = await parseJsonBody(request, clientFormSchema);
    const client = await createClient(
      membership.workspaceId,
      membership.workspace.planId,
      body,
    );

    return jsonOk({ client }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
