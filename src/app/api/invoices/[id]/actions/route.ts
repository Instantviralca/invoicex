import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { performInvoiceAction } from "@/lib/services/invoices";
import { invoiceActionSchema } from "@/lib/validations/invoices";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user, membership } = await requireAppContext();
    const { id } = await context.params;
    const body = await parseJsonBody(request, invoiceActionSchema);

    if (body.action === "send") assertPermission(membership.role, "invoices:send");
    else if (body.action === "void") assertPermission(membership.role, "invoices:void");
    else if (body.action === "archive" || body.action === "restore")
      assertPermission(membership.role, "invoices:archive");
    else if (body.action === "add_payment" || body.action === "mark_paid")
      assertPermission(membership.role, "payments:record");
    else assertPermission(membership.role, "invoices:update");

    const document = await performInvoiceAction(
      membership.workspaceId,
      membership.workspace.planId,
      id,
      body,
      user.id,
    );

    return jsonOk({ document });
  } catch (error) {
    return handleApiError(error);
  }
}
