import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  clients,
  dataExportRequests,
  invoices,
  quotes,
  users,
} from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";
import { uploadBuffer } from "@/lib/storage/s3";
import { absoluteUrl } from "@/lib/utils";

export async function runDataExportsJob() {
  const idempotencyKey = dailyJobKey("data-exports");

  return runIdempotentJob("data-exports", idempotencyKey, async () => {
    const pending = await db
      .select()
      .from(dataExportRequests)
      .where(inArray(dataExportRequests.status, ["pending", "processing"]))
      .limit(10);

    let completed = 0;

    for (const request of pending) {
      await db
        .update(dataExportRequests)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(dataExportRequests.id, request.id));

      const workspaceClients = await db
        .select()
        .from(clients)
        .where(eq(clients.workspaceId, request.workspaceId));

      const workspaceInvoices = await db
        .select()
        .from(invoices)
        .where(eq(invoices.workspaceId, request.workspaceId));

      const workspaceQuotes = await db
        .select()
        .from(quotes)
        .where(eq(quotes.workspaceId, request.workspaceId));

      const payload = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          clients: workspaceClients,
          invoices: workspaceInvoices,
          quotes: workspaceQuotes,
        },
        null,
        2,
      );

      const buffer = Buffer.from(payload, "utf8");
      const upload = await uploadBuffer({
        workspaceId: request.workspaceId,
        purpose: "export",
        filename: `export-${request.id}.json`,
        mimeType: "application/json",
        buffer,
        uploadedByUserId: request.userId,
      });

      await db
        .update(dataExportRequests)
        .set({
          status: "completed",
          fileAssetId: upload.fileAssetId,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dataExportRequests.id, request.id));

      const [user] = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Your InvoiceX data export is ready",
          template: "contact-confirmation",
          templateProps: {
            name: user.name,
            subject: "Data export ready",
          },
          workspaceId: request.workspaceId,
          userId: request.userId,
          relatedType: "data_export",
          relatedId: request.id,
        });
      }

      completed += 1;
    }

    return { completed, processed: pending.length, downloadHint: absoluteUrl("/app/settings/data") };
  });
}
