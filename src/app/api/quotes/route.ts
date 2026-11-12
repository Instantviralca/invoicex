import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { createDraftQuote, listQuotes } from "@/lib/services/quotes";
import { quoteFormSchema, quoteListQuerySchema } from "@/lib/validations/quotes";

export async function GET(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "quotes:read");

    const url = new URL(request.url);
    const query = quoteListQuerySchema.parse(Object.fromEntries(url.searchParams));
    const result = await listQuotes(membership.workspaceId, query);

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, membership } = await requireAppContext();
    assertPermission(membership.role, "quotes:create");

    const body = await parseJsonBody(request, quoteFormSchema);
    const document = await createDraftQuote(
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
