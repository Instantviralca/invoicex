import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { acceptTeamInvite } from "@/lib/services/team";

const schema = z.object({
  workspaceId: z.string().uuid(),
  token: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const { user } = await requireAppContext();
    const body = await parseJsonBody(request, schema);

    const result = await acceptTeamInvite({
      userId: user.id,
      userEmail: user.email,
      workspaceId: body.workspaceId,
      token: body.token,
    });

    return jsonOk({ ...result, message: "Invitation accepted." });
  } catch (error) {
    return handleApiError(error);
  }
}
