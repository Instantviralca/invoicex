import { requireAppContext } from "@/lib/app-context";
import { handleApiError } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { exportClientsCsv } from "@/lib/services/clients";

export async function GET() {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "clients:read");

    const csv = await exportClientsCsv(membership.workspaceId);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="clients.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
