import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { canUseReminders } from "@/lib/entitlements";
import {
  listReminderSchedules,
  upsertWorkspaceReminderSchedules,
} from "@/lib/services/reminders";

const scheduleSchema = z.object({
  schedules: z.array(
    z.object({
      offsetDays: z.number().int().min(-30).max(30),
      enabled: z.boolean(),
      clientId: z.string().uuid().optional().nullable(),
    }),
  ),
});

export async function GET() {
  try {
    const { membership } = await requireAppContext();

    if (!canUseReminders(membership.workspace.planId)) {
      throw new Error("Automatic reminders require a Pro plan or higher.");
    }

    const schedules = await listReminderSchedules(membership.workspaceId);
    return jsonOk({ schedules });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { membership } = await requireAppContext();

    if (!canUseReminders(membership.workspace.planId)) {
      throw new Error("Automatic reminders require a Pro plan or higher.");
    }

    const body = await parseJsonBody(request, scheduleSchema);
    await upsertWorkspaceReminderSchedules(membership.workspaceId, body.schedules);
    const schedules = await listReminderSchedules(membership.workspaceId);

    return jsonOk({ schedules });
  } catch (error) {
    return handleApiError(error);
  }
}
