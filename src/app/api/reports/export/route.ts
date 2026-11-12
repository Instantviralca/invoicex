import { requireAppContext } from "@/lib/app-context";
import { handleApiError } from "@/lib/api/response";
import { resolveDateRange, type DateRangePreset } from "@/lib/date-ranges";
import { assertReportsAccess, exportReportCsv } from "@/lib/services/reports";

export async function GET(request: Request) {
  try {
    const { membership } = await requireAppContext();
    await assertReportsAccess(
      membership.workspaceId,
      membership.workspace.planId,
    );

    const url = new URL(request.url);
    const range = resolveDateRange(
      (url.searchParams.get("range") as DateRangePreset) ?? "this_month",
      url.searchParams.get("from") ?? undefined,
      url.searchParams.get("to") ?? undefined,
    );

    const csv = await exportReportCsv(membership.workspaceId, range);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="report.csv"',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
