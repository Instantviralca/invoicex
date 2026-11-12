import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { performQuoteAction } from "@/lib/services/quotes";
import { quoteActionSchema } from "@/lib/validations/quotes";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { user, membership } = await requireAppContext();
    const { id } = await context.params;
    const body = await parseJsonBody(request, quoteActionSchema);

    if (body.action === "send") assertPermission(membership.role, "quotes:send");
    else if (body.action === "archive" || body.action === "restore")
      assertPermission(membership.role, "quotes:archive");
    else assertPermission(membership.role, "quotes:update");

    const document = await performQuoteAction(
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
