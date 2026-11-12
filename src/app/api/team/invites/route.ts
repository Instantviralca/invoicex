import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { inviteTeamMember, listTeamMembers } from "@/lib/services/team";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["administrator", "staff", "viewer"]),
});

export async function GET() {
  try {
    const { membership } = await requireAppContext();
    const members = await listTeamMembers(membership.workspaceId);
    return jsonOk({ members });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, membership } = await requireAppContext();
    const body = await parseJsonBody(request, inviteSchema);

    const invite = await inviteTeamMember({
      workspaceId: membership.workspaceId,
      workspaceName: membership.workspace.name,
      planId: membership.workspace.planId,
      inviterUserId: user.id,
      inviterName: user.name,
      inviterRole: membership.role,
      email: body.email,
      role: body.role,
    });

    return jsonOk({ invite }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
