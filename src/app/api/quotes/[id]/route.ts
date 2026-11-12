import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { createDraftQuote, getQuoteWithLines } from "@/lib/services/quotes";
import { quoteFormSchema } from "@/lib/validations/quotes";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "quotes:read");
    const { id } = await context.params;

    const document = await getQuoteWithLines(membership.workspaceId, id);
    if (!document) return handleApiError(new Error("NotFound"));

    return jsonOk({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user, membership } = await requireAppContext();
    assertPermission(membership.role, "quotes:update");
    const { id } = await context.params;

    const body = await parseJsonBody(request, quoteFormSchema);
    const document = await createDraftQuote(
      membership.workspaceId,
      membership.workspace.planId,
      body,
      user.id,
      id,
    );

    return jsonOk({ document });
  } catch (error) {
    return handleApiError(error);
  }
}
