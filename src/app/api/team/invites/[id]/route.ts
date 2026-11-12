import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { removeTeamMember, updateTeamMemberRole } from "@/lib/services/team";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  action: z.enum(["update_role", "remove"]),
  role: z.enum(["administrator", "staff", "viewer"]).optional(),
});

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { membership } = await requireAppContext();
    const { id } = await context.params;
    const body = await parseJsonBody(request, updateSchema);

    if (body.action === "remove") {
      await removeTeamMember({
        workspaceId: membership.workspaceId,
        actorRole: membership.role,
        memberId: id,
      });
      return jsonOk({ removed: true });
    }

    if (!body.role) {
      throw new Error("Role is required.");
    }

    await updateTeamMemberRole({
      workspaceId: membership.workspaceId,
      actorRole: membership.role,
      memberId: id,
      role: body.role,
    });

    return jsonOk({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
