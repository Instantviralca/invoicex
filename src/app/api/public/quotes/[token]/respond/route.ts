import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { hashToken } from "@/lib/crypto";
import { recordQuoteResponse } from "@/lib/services/quotes";
import { quoteResponseSchema } from "@/lib/validations/quotes";

type RouteContext = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const body = await parseJsonBody(request, quoteResponseSchema);
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const ipHash = hashToken(ip);

    await recordQuoteResponse(token, body, {
      ipHash,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
