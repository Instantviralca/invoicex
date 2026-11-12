import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { createDraftInvoice, listInvoices } from "@/lib/services/invoices";
import { invoiceFormSchema, invoiceListQuerySchema } from "@/lib/validations/invoices";

export async function GET(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:read");

    const url = new URL(request.url);
    const query = invoiceListQuerySchema.parse(Object.fromEntries(url.searchParams));
    const result = await listInvoices(membership.workspaceId, query);

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, membership } = await requireAppContext();
    assertPermission(membership.role, "invoices:create");

    const body = await parseJsonBody(request, invoiceFormSchema);
    const document = await createDraftInvoice(
      membership.workspaceId,
      membership.workspace.planId,
      body,
      user.id,
    );

    return jsonOk({ document }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
