import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { createCatalogueItem, listCatalogueItems } from "@/lib/services/catalogue";
import { catalogueItemSchema, catalogueListQuerySchema } from "@/lib/validations/catalogue";

export async function GET(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "catalogue:read");

    const url = new URL(request.url);
    const query = catalogueListQuerySchema.parse(Object.fromEntries(url.searchParams));
    const result = await listCatalogueItems(membership.workspaceId, query);

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "catalogue:manage");

    const body = await parseJsonBody(request, catalogueItemSchema);
    const item = await createCatalogueItem(
      membership.workspaceId,
      membership.workspace.planId,
      body,
    );

    return jsonOk({ item }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
