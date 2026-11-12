import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  accountDeletionRequests,
  users,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";

export async function runAccountDeletionJob() {
  const idempotencyKey = dailyJobKey("account-deletion");

  return runIdempotentJob("account-deletion", idempotencyKey, async () => {
    const now = new Date();

    const due = await db
      .select()
      .from(accountDeletionRequests)
      .where(
        and(
          eq(accountDeletionRequests.status, "pending"),
          lte(accountDeletionRequests.scheduledFor, now),
        ),
      )
      .limit(20);

    let completed = 0;

    for (const request of due) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, request.userId))
        .limit(1);

      if (!user) {
        await db
          .update(accountDeletionRequests)
          .set({ status: "cancelled", updatedAt: now })
          .where(eq(accountDeletionRequests.id, request.id));
        continue;
      }

      if (request.workspaceId) {
        const memberships = await db
          .select()
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, request.workspaceId));

        if (memberships.length <= 1) {
          await db.delete(workspaces).where(eq(workspaces.id, request.workspaceId));
        } else {
          await db
            .delete(workspaceMembers)
            .where(
              and(
                eq(workspaceMembers.workspaceId, request.workspaceId),
                eq(workspaceMembers.userId, request.userId),
              ),
            );
        }
      }

      await db.delete(users).where(eq(users.id, request.userId));

      await db
        .update(accountDeletionRequests)
        .set({ status: "completed", completedAt: now, updatedAt: now })
        .where(eq(accountDeletionRequests.id, request.id));

      completed += 1;
    }

    return { completed, processed: due.length };
  });
}

export async function sendAccountDeletionConfirmation(input: {
  userId: string;
  email: string;
  name: string;
  scheduledFor: Date;
}) {
  return sendEmail({
    to: input.email,
    subject: "Account deletion scheduled",
    template: "account-deletion-confirmation",
    templateProps: {
      name: input.name,
      scheduledFor: input.scheduledFor.toLocaleDateString("en-GB", {
        dateStyle: "long",
      }),
    },
    userId: input.userId,
  });
}
