import { eq } from "drizzle-orm";
import { requireAppContext } from "@/lib/app-context";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";
import { db } from "@/db";
import { businessProfiles } from "@/db/schema";
import { uploadBuffer } from "@/lib/storage/s3";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { user, membership } = await requireAppContext();
    assertPermission(membership.role, "businessProfile:manage");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new Error("Please choose a logo file to upload.");
    }

    if (file.size > MAX_LOGO_BYTES) {
      throw new Error("Logo must be 2 MB or smaller.");
    }

    const mimeType = file.type || "application/octet-stream";
    const buffer = Buffer.from(await file.arrayBuffer());

    const upload = await uploadBuffer({
      workspaceId: membership.workspaceId,
      purpose: "logo",
      filename: file.name,
      mimeType,
      buffer,
      uploadedByUserId: user.id,
    });

    const [profile] = await db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.workspaceId, membership.workspaceId))
      .limit(1);

    if (profile) {
      await db
        .update(businessProfiles)
        .set({ logoFileId: upload.fileAssetId, updatedAt: new Date() })
        .where(eq(businessProfiles.id, profile.id));
    }

    return jsonOk({
      fileAssetId: upload.fileAssetId,
      publicUrl: upload.publicUrl,
      message: "Logo uploaded successfully.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
