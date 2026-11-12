import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import {
  deleteRecurringInvoice,
  getRecurringInvoice,
  updateRecurringInvoice,
} from "@/lib/services/recurring";
import { recurringFormSchema } from "@/lib/validations/recurring";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:read");
    const { id } = await context.params;

    const recurring = await getRecurringInvoice(membership.workspaceId, id);
    if (!recurring) throw new Error("NotFound");

    return jsonOk({ recurring });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:update");
    const { id } = await context.params;

    const body = await parseJsonBody(request, recurringFormSchema);
    const recurring = await updateRecurringInvoice(
      membership.workspaceId,
      membership.workspace.planId,
      id,
      body,
    );

    return jsonOk({ recurring });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:update");
    const { id } = await context.params;

    await deleteRecurringInvoice(membership.workspaceId, id);
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
