import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import {
  createRecurringInvoice,
  listRecurringInvoices,
} from "@/lib/services/recurring";
import {
  recurringFormSchema,
  recurringListQuerySchema,
} from "@/lib/validations/recurring";

export async function GET(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:read");

    const url = new URL(request.url);
    const query = recurringListQuerySchema.parse(Object.fromEntries(url.searchParams));

    const result = await listRecurringInvoices(membership.workspaceId, query);
    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:create");

    const body = await parseJsonBody(request, recurringFormSchema);
    const recurring = await createRecurringInvoice(
      membership.workspaceId,
      membership.workspace.planId,
      body,
    );

    return jsonOk({ recurring }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
