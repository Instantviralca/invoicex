import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobRuns } from "@/db/schema";
import { logger } from "@/lib/logger";

export type JobRunResult = {
  skipped: boolean;
  status: "completed" | "failed" | "skipped";
  metadata?: Record<string, unknown>;
  errorMessage?: string;
};

export async function runIdempotentJob(
  jobName: string,
  idempotencyKey: string,
  handler: () => Promise<Record<string, unknown> | void>,
): Promise<JobRunResult> {
  const existing = await db
    .select()
    .from(jobRuns)
    .where(eq(jobRuns.idempotencyKey, idempotencyKey))
    .limit(1);

  if (existing[0]?.status === "completed") {
    return {
      skipped: true,
      status: "skipped",
      metadata: (existing[0].metadata as Record<string, unknown> | null) ?? undefined,
    };
  }

  const startedAt = new Date();

  try {
    if (!existing[0]) {
      await db.insert(jobRuns).values({
        jobName,
        idempotencyKey,
        status: "running",
        startedAt,
      });
    } else {
      await db
        .update(jobRuns)
        .set({
          status: "running",
          attempts: existing[0].attempts + 1,
          startedAt,
          errorMessage: null,
        })
        .where(eq(jobRuns.id, existing[0].id));
    }

    const metadata = ((await handler()) ?? {}) as Record<string, unknown>;

    await db
      .update(jobRuns)
      .set({
        status: "completed",
        finishedAt: new Date(),
        metadata,
        errorMessage: null,
      })
      .where(eq(jobRuns.idempotencyKey, idempotencyKey as string));

    logger.info({ jobName, idempotencyKey, metadata }, "Job completed");

    return { skipped: false, status: "completed", metadata };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown job failure";

    await db
      .update(jobRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        errorMessage: message,
      })
      .where(eq(jobRuns.idempotencyKey, idempotencyKey));

    logger.error({ err: error, jobName, idempotencyKey }, "Job failed");

    return { skipped: false, status: "failed", errorMessage: message };
  }
}

export function dailyJobKey(jobName: string, date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  return `${jobName}:${day}`;
}
