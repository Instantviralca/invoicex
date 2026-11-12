import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { fileAssets } from "@/db/schema";
import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";
import { deleteStoredObject } from "@/lib/storage/s3";

const TEMP_MAX_AGE_HOURS = 48;

export async function runCleanupTempUploadsJob() {
  const idempotencyKey = dailyJobKey("cleanup-temp-uploads");

  return runIdempotentJob("cleanup-temp-uploads", idempotencyKey, async () => {
    const cutoff = new Date(Date.now() - TEMP_MAX_AGE_HOURS * 60 * 60 * 1000);

    const stale = await db
      .select()
      .from(fileAssets)
      .where(
        and(eq(fileAssets.purpose, "temp"), lt(fileAssets.createdAt, cutoff)),
      )
      .limit(100);

    let removed = 0;

    for (const asset of stale) {
      await deleteStoredObject(asset.storageKey).catch(() => undefined);
      await db.delete(fileAssets).where(eq(fileAssets.id, asset.id));
      removed += 1;
    }

    return { removed, scanned: stale.length };
  });
}
