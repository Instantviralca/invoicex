import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { db } from "@/db";
import { dataExportRequests } from "@/db/schema";

export async function POST() {
  try {
    const { user, membership } = await requireAppContext();
    assertPermission(membership.role, "exports:request");

    await db.insert(dataExportRequests).values({
      workspaceId: membership.workspaceId,
      userId: user.id,
      status: "pending",
    });

    return jsonOk({
      message: "Your data export has been queued. We will email you when it is ready.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
