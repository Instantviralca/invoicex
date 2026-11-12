import { and, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";

const MAX_RETRIES = 25;
const RETRY_AGE_HOURS = 24;

export async function runEmailRetriesJob() {
  const idempotencyKey = dailyJobKey("email-retries");

  return runIdempotentJob("email-retries", idempotencyKey, async () => {
    const cutoff = new Date(Date.now() - RETRY_AGE_HOURS * 60 * 60 * 1000);

    const failed = await db
      .select()
      .from(emailLogs)
      .where(
        and(
          inArray(emailLogs.status, ["failed", "queued"]),
          lt(emailLogs.updatedAt, cutoff),
        ),
      )
      .limit(MAX_RETRIES);

    let retried = 0;
    let skipped = 0;

    for (const log of failed) {
      if (log.status === "queued") {
        skipped += 1;
        continue;
      }

      // Retries require the original React Email template props, which are not
      // persisted. Failed sends remain in email_logs for manual investigation.
      skipped += 1;
    }

    return { retried, skipped, candidates: failed.length };
  });
}
