import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { parseClientCsv } from "@/lib/services/clients";
import { clientImportPreviewSchema } from "@/lib/validations/clients";

export async function POST(request: Request) {
  try {
    const { membership } = await requireAppContext();
    assertPermission(membership.role, "clients:create");

    const body = await parseJsonBody(request, clientImportPreviewSchema);
    const preview = parseClientCsv(body.csv);

    return jsonOk(preview);
  } catch (error) {
    return handleApiError(error);
  }
}
