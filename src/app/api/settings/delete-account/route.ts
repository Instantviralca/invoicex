import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { db } from "@/db";
import { accountDeletionRequests } from "@/db/schema";
import { sendAccountDeletionConfirmation } from "@/lib/jobs/account-deletion";

const schema = z.object({
  confirmationText: z.literal("DELETE"),
});

export async function POST(request: Request) {
  try {
    const { user, membership } = await requireAppContext();
    await parseJsonBody(request, schema);

    const scheduledFor = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await db.insert(accountDeletionRequests).values({
      userId: user.id,
      workspaceId: membership.workspaceId,
      status: "pending",
      confirmationText: "DELETE",
      scheduledFor,
    });

    await sendAccountDeletionConfirmation({
      userId: user.id,
      email: user.email,
      name: user.name,
      scheduledFor,
    });

    return jsonOk({
      message:
        "Account deletion scheduled for 14 days from now. Contact support to cancel.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
