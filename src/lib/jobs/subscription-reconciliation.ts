import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { subscriptions, users, workspaceMembers, workspaces } from "@/db/schema";
import { plans } from "@/config/brand";
import { billingPortalUrl } from "@/lib/email/document-emails";
import { sendEmail } from "@/lib/email/send";
import { dailyJobKey, runIdempotentJob } from "@/lib/jobs/runner";
import { getMollieClient } from "@/lib/mollie/client";
import { logger } from "@/lib/logger";

export async function runSubscriptionReconciliationJob() {
  const idempotencyKey = dailyJobKey("subscription-reconciliation");

  return runIdempotentJob(
    "subscription-reconciliation",
    idempotencyKey,
    async () => {
      const now = new Date();
      let downgraded = 0;
      let notified = 0;

      const expired = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            inArray(subscriptions.status, ["cancelled", "expired"]),
            lt(subscriptions.currentPeriodEnd, now),
          ),
        );

      for (const subscription of expired) {
        if (
          subscription.mollieCustomerId &&
          subscription.mollieSubscriptionId
        ) {
          try {
            const mollie = getMollieClient();
            await mollie.customerSubscriptions.cancel(
              subscription.mollieSubscriptionId,
              { customerId: subscription.mollieCustomerId },
            );
          } catch (error) {
            logger.warn(
              { err: error, subscriptionId: subscription.id },
              "Could not cancel Mollie subscription during reconciliation",
            );
          }
        }

        await db
          .update(workspaces)
          .set({ planId: "free", updatedAt: now })
          .where(eq(workspaces.id, subscription.workspaceId));

        await db
          .update(subscriptions)
          .set({ planId: "free", status: "expired", updatedAt: now })
          .where(eq(subscriptions.id, subscription.id));

        downgraded += 1;
      }

      const dueForCancellation = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.cancelAtPeriodEnd, true),
            isNotNull(subscriptions.currentPeriodEnd),
            lt(subscriptions.currentPeriodEnd, now),
            inArray(subscriptions.status, ["cancelled", "active"]),
          ),
        );

      for (const subscription of dueForCancellation) {
        if (
          subscription.mollieCustomerId &&
          subscription.mollieSubscriptionId
        ) {
          try {
            const mollie = getMollieClient();
            await mollie.customerSubscriptions.cancel(
              subscription.mollieSubscriptionId,
              { customerId: subscription.mollieCustomerId },
            );
          } catch (error) {
            logger.warn(
              { err: error, subscriptionId: subscription.id },
              "Could not cancel Mollie subscription at period end",
            );
          }
        }

        await db
          .update(workspaces)
          .set({ planId: "free", updatedAt: now })
          .where(eq(workspaces.id, subscription.workspaceId));

        await db
          .update(subscriptions)
          .set({ planId: "free", status: "expired", updatedAt: now })
          .where(eq(subscriptions.id, subscription.id));

        downgraded += 1;
      }

      const pastDue = await db
        .select({
          subscription: subscriptions,
          workspace: workspaces,
        })
        .from(subscriptions)
        .innerJoin(workspaces, eq(workspaces.id, subscriptions.workspaceId))
        .where(eq(subscriptions.status, "past_due"))
        .limit(50);

      for (const row of pastDue) {
        const [owner] = await db
          .select({ email: users.email, name: users.name })
          .from(workspaceMembers)
          .innerJoin(users, eq(users.id, workspaceMembers.userId))
          .where(
            and(
              eq(workspaceMembers.workspaceId, row.workspace.id),
              eq(workspaceMembers.role, "owner"),
            ),
          )
          .limit(1);

        if (!owner?.email) continue;

        await sendEmail({
          to: owner.email,
          subject: "Action required: subscription payment failed",
          template: "payment-failed",
          templateProps: {
            name: owner.name,
            planName: plans[row.subscription.planId].name,
            billingUrl: billingPortalUrl(),
          },
          workspaceId: row.workspace.id,
          relatedType: "subscription",
          relatedId: row.subscription.id,
        });

        notified += 1;
      }

      return { downgraded, notified };
    },
  );
}
