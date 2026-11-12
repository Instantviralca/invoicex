import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import {
  archiveCatalogueItem,
  getCatalogueItem,
  updateCatalogueItem,
} from "@/lib/services/catalogue";
import { catalogueItemSchema } from "@/lib/validations/catalogue";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "catalogue:read");
    const { id } = await context.params;

    const item = await getCatalogueItem(membership.workspaceId, id);
    if (!item) return handleApiError(new Error("NotFound"));

    return jsonOk({ item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "catalogue:manage");
    const { id } = await context.params;

    const body = await parseJsonBody(request, catalogueItemSchema);
    const item = await updateCatalogueItem(
      membership.workspaceId,
      membership.workspace.planId,
      id,
      body,
    );

    return jsonOk({ item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "catalogue:manage");
    const { id } = await context.params;

    await archiveCatalogueItem(membership.workspaceId, id);
    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
