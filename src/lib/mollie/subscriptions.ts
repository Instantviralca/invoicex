import {
  PaymentStatus,
  SequenceType,
  SubscriptionStatus as MollieSubscriptionStatus,
} from "@mollie/api-client";
import { and, desc, eq } from "drizzle-orm";
import {
  type BillingInterval,
  brand,
  getPlanPrice,
  penceToMollieAmount,
  type PlanId,
  plans,
} from "@/config/brand";
import { db } from "@/db";
import {
  molliePayments,
  subscriptionEvents,
  subscriptions,
  users,
  webhookFailures,
  workspaceMembers,
  workspaces,
} from "@/db/schema";
import {
  formatBillingDate,
  intervalLabel,
  planDisplayName,
  type SubscriptionStatus,
} from "@/lib/billing/access";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";
import { getMollieClient, getMollieWebhookUrl } from "@/lib/mollie/client";
import { absoluteUrl } from "@/lib/utils";

const PAID_PLANS = ["starter", "pro", "business"] as const;
type PaidPlanId = (typeof PAID_PLANS)[number];

export class BillingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_plan"
      | "already_subscribed"
      | "not_subscribed"
      | "pending_checkout"
      | "provider_error",
  ) {
    super(message);
    this.name = "BillingError";
  }
}

export function mapMolliePaymentStatus(
  status: PaymentStatus,
): "pending" | "paid" | "failed" | "cancelled" | "expired" {
  switch (status) {
    case PaymentStatus.paid:
      return "paid";
    case PaymentStatus.failed:
      return "failed";
    case PaymentStatus.canceled:
      return "cancelled";
    case PaymentStatus.expired:
      return "expired";
    default:
      return "pending";
  }
}

export function mapMollieSubscriptionStatus(
  status: MollieSubscriptionStatus,
): SubscriptionStatus {
  switch (status) {
    case MollieSubscriptionStatus.active:
      return "active";
    case MollieSubscriptionStatus.pending:
      return "pending";
    case MollieSubscriptionStatus.canceled:
      return "cancelled";
    case MollieSubscriptionStatus.suspended:
      return "past_due";
    case MollieSubscriptionStatus.completed:
      return "expired";
    default:
      return "pending";
  }
}

function mollieInterval(interval: BillingInterval): string {
  return interval === "year" ? "12 months" : "1 month";
}

function addBillingPeriod(start: Date, interval: BillingInterval): Date {
  const end = new Date(start);
  if (interval === "year") {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return end;
}

function isPaidPlan(planId: PlanId): planId is PaidPlanId {
  return PAID_PLANS.includes(planId as PaidPlanId);
}

async function getSubscriptionRow(workspaceId: string) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, workspaceId))
    .limit(1);

  if (!row) {
    throw new BillingError("Subscription record not found.", "not_subscribed");
  }

  return row;
}

async function getWorkspaceOwner(workspaceId: string) {
  const [owner] = await db
    .select({ email: users.email, name: users.name, userId: users.id })
    .from(workspaceMembers)
    .innerJoin(users, eq(users.id, workspaceMembers.userId))
    .where(
      and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.role, "owner"),
      ),
    )
    .limit(1);

  return owner ?? null;
}

async function hasProcessedEvent(idempotencyKey: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: subscriptionEvents.id })
    .from(subscriptionEvents)
    .where(eq(subscriptionEvents.idempotencyKey, idempotencyKey))
    .limit(1);

  return Boolean(existing);
}

async function recordSubscriptionEvent(input: {
  workspaceId: string;
  subscriptionId?: string | null;
  eventType: string;
  mollieResourceId?: string | null;
  payload?: unknown;
  idempotencyKey: string;
}) {
  await db.insert(subscriptionEvents).values({
    workspaceId: input.workspaceId,
    subscriptionId: input.subscriptionId ?? null,
    eventType: input.eventType,
    mollieResourceId: input.mollieResourceId ?? null,
    payload: input.payload ?? null,
    idempotencyKey: input.idempotencyKey,
  });
}

async function logWebhookFailure(
  resourceId: string | null,
  payload: unknown,
  errorMessage: string,
) {
  await db.insert(webhookFailures).values({
    provider: "mollie",
    resourceId,
    payload,
    errorMessage,
  });
}

async function upsertMolliePayment(input: {
  workspaceId: string;
  molliePaymentId: string;
  mollieCustomerId?: string | null;
  status: string;
  amountValue: string;
  amountCurrency: string;
  sequenceType?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  paidAt?: Date | null;
}) {
  const existing = await db
    .select({ id: molliePayments.id })
    .from(molliePayments)
    .where(eq(molliePayments.molliePaymentId, input.molliePaymentId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(molliePayments)
      .set({
        status: input.status,
        paidAt: input.paidAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(molliePayments.molliePaymentId, input.molliePaymentId));
    return;
  }

  await db.insert(molliePayments).values({
    workspaceId: input.workspaceId,
    molliePaymentId: input.molliePaymentId,
    mollieCustomerId: input.mollieCustomerId ?? null,
    status: input.status,
    amountValue: input.amountValue,
    amountCurrency: input.amountCurrency,
    sequenceType: input.sequenceType ?? null,
    description: input.description ?? null,
    metadata: input.metadata ?? null,
    paidAt: input.paidAt ?? null,
  });
}

async function ensureMollieCustomer(input: {
  workspaceId: string;
  workspaceName: string;
  ownerEmail: string;
  ownerName: string;
  existingCustomerId?: string | null;
}): Promise<string> {
  if (input.existingCustomerId) {
    return input.existingCustomerId;
  }

  const mollie = getMollieClient();
  const customer = await mollie.customers.create({
    name: input.ownerName || input.workspaceName,
    email: input.ownerEmail,
    metadata: {
      workspaceId: input.workspaceId,
    },
  });

  await db
    .update(subscriptions)
    .set({
      mollieCustomerId: customer.id,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, input.workspaceId));

  return customer.id;
}

export async function createCheckout(input: {
  workspaceId: string;
  workspaceName: string;
  ownerEmail: string;
  ownerName: string;
  planId: PaidPlanId;
  interval: BillingInterval;
}) {
  if (!isPaidPlan(input.planId)) {
    throw new BillingError("Invalid plan selected.", "invalid_plan");
  }

  const subscription = await getSubscriptionRow(input.workspaceId);
  const pricePence = getPlanPrice(input.planId, input.interval);

  if (pricePence <= 0) {
    throw new BillingError("Invalid plan selected.", "invalid_plan");
  }

  if (
    subscription.status === "active" &&
    subscription.planId !== "free" &&
    subscription.mollieSubscriptionId
  ) {
    throw new BillingError(
      "You already have an active subscription. Use change plan instead.",
      "already_subscribed",
    );
  }

  const customerId = await ensureMollieCustomer({
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
    ownerEmail: input.ownerEmail,
    ownerName: input.ownerName,
    existingCustomerId: subscription.mollieCustomerId,
  });

  const mollie = getMollieClient();
  const description = `${brand.productName} ${plans[input.planId].name} (${intervalLabel(input.interval)})`;

  const payment = await mollie.payments.create({
    amount: {
      currency: "GBP",
      value: penceToMollieAmount(pricePence),
    },
    description,
    redirectUrl: absoluteUrl("/app/subscription/return"),
    webhookUrl: getMollieWebhookUrl(),
    customerId,
    sequenceType: SequenceType.first,
    metadata: {
      workspaceId: input.workspaceId,
      planId: input.planId,
      interval: input.interval,
      checkoutType: "subscription_first",
    },
  });

  await upsertMolliePayment({
    workspaceId: input.workspaceId,
    molliePaymentId: payment.id,
    mollieCustomerId: customerId,
    status: mapMolliePaymentStatus(payment.status),
    amountValue: payment.amount.value,
    amountCurrency: payment.amount.currency,
    sequenceType: payment.sequenceType ?? SequenceType.first,
    description: payment.description ?? description,
    metadata: {
      workspaceId: input.workspaceId,
      planId: input.planId,
      interval: input.interval,
      checkoutType: "subscription_first",
    },
  });

  await db
    .update(subscriptions)
    .set({
      planId: input.planId,
      interval: input.interval,
      status: "pending",
      pendingPlanId: null,
      pendingInterval: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscription.id));

  if (!payment.getCheckoutUrl()) {
    throw new BillingError(
      "Mollie did not return a checkout URL.",
      "provider_error",
    );
  }

  return {
    checkoutUrl: payment.getCheckoutUrl()!,
    paymentId: payment.id,
    planId: input.planId,
    interval: input.interval,
    amountPence: pricePence,
  };
}

export async function createSubscriptionAfterMandate(input: {
  workspaceId: string;
  customerId: string;
  mandateId: string;
  planId: PaidPlanId;
  interval: BillingInterval;
}) {
  const mollie = getMollieClient();
  const pricePence = getPlanPrice(input.planId, input.interval);
  const description = `${brand.productName} ${plans[input.planId].name} (${intervalLabel(input.interval)})`;

  const subscription = await mollie.customerSubscriptions.create({
    customerId: input.customerId,
    amount: {
      currency: "GBP",
      value: penceToMollieAmount(pricePence),
    },
    interval: mollieInterval(input.interval),
    description,
    mandateId: input.mandateId,
    webhookUrl: getMollieWebhookUrl(),
    metadata: {
      workspaceId: input.workspaceId,
      planId: input.planId,
      interval: input.interval,
    },
  });

  const periodStart = subscription.startDate
    ? new Date(subscription.startDate)
    : new Date();
  const periodEnd = addBillingPeriod(periodStart, input.interval);

  await db
    .update(subscriptions)
    .set({
      planId: input.planId,
      interval: input.interval,
      status: mapMollieSubscriptionStatus(subscription.status),
      mollieCustomerId: input.customerId,
      mollieSubscriptionId: subscription.id,
      mollieMandateId: input.mandateId,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      pendingPlanId: null,
      pendingInterval: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, input.workspaceId));

  await db
    .update(workspaces)
    .set({
      planId: input.planId,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, input.workspaceId));

  return subscription;
}

export async function handlePaymentPaid(paymentId: string) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.get(paymentId);
  const metadata = (payment.metadata ?? {}) as Record<string, string>;
  const workspaceId = metadata.workspaceId;

  if (!workspaceId) {
    throw new Error("Payment metadata is missing workspaceId.");
  }

  const idempotencyKey = `payment:${payment.id}:paid`;
  if (await hasProcessedEvent(idempotencyKey)) {
    return { processed: false, reason: "duplicate" as const };
  }

  const paidAt =
    payment.paidAt != null ? new Date(String(payment.paidAt)) : new Date();

  await upsertMolliePayment({
    workspaceId,
    molliePaymentId: payment.id,
    mollieCustomerId: payment.customerId ?? null,
    status: mapMolliePaymentStatus(payment.status),
    amountValue: payment.amount.value,
    amountCurrency: payment.amount.currency,
    sequenceType: payment.sequenceType ?? null,
    description: payment.description ?? null,
    metadata: metadata as Record<string, unknown>,
    paidAt,
  });

  const subscription = await getSubscriptionRow(workspaceId);

  if (payment.status !== PaymentStatus.paid) {
    return { processed: true, status: payment.status };
  }

  const checkoutType = metadata.checkoutType ?? "subscription_first";
  const planId = (metadata.planId ?? subscription.planId) as PaidPlanId;
  const interval = (metadata.interval ?? subscription.interval) as BillingInterval;

  if (
    checkoutType === "subscription_first" &&
    payment.sequenceType === SequenceType.first
  ) {
    const customerId = payment.customerId;
    const mandateId = payment.mandateId;

    if (!customerId || !mandateId) {
      throw new Error("First payment is missing customer or mandate.");
    }

    if (!isPaidPlan(planId)) {
      throw new Error("Invalid plan in payment metadata.");
    }

    if (!subscription.mollieSubscriptionId) {
      await createSubscriptionAfterMandate({
        workspaceId,
        customerId,
        mandateId,
        planId,
        interval,
      });

      const owner = await getWorkspaceOwner(workspaceId);
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: `Your ${planDisplayName(planId)} subscription is active`,
          template: "subscription-activated",
          templateProps: {
            name: owner.name,
            planName: planDisplayName(planId),
            intervalLabel: intervalLabel(interval),
          },
          workspaceId,
          userId: owner.userId,
          relatedType: "subscription",
          relatedId: subscription.id,
        });
      }
    }
  } else if (subscription.mollieSubscriptionId) {
    const periodStart = paidAt;
    const periodEnd = addBillingPeriod(periodStart, subscription.interval);

    await db
      .update(subscriptions)
      .set({
        status: "active",
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.workspaceId, workspaceId));

    if (subscription.pendingPlanId && subscription.pendingInterval) {
      await applyPendingPlanChange(workspaceId);
    }
  }

  if (payment.status === PaymentStatus.paid) {
    await recordSubscriptionEvent({
      workspaceId,
      subscriptionId: subscription.id,
      eventType: "payment.paid",
      mollieResourceId: payment.id,
      payload: payment,
      idempotencyKey,
    });
  }

  return { processed: true, status: payment.status };
}

async function applyPendingPlanChange(workspaceId: string) {
  const subscription = await getSubscriptionRow(workspaceId);

  if (!subscription.pendingPlanId || !subscription.pendingInterval) {
    return;
  }

  if (
    !subscription.mollieCustomerId ||
    !subscription.mollieSubscriptionId
  ) {
    return;
  }

  const newPlanId = subscription.pendingPlanId;
  const newInterval = subscription.pendingInterval;
  const pricePence = getPlanPrice(newPlanId, newInterval);

  const mollie = getMollieClient();
  await mollie.customerSubscriptions.update(
    subscription.mollieSubscriptionId,
    {
      customerId: subscription.mollieCustomerId,
      amount: {
        currency: "GBP",
        value: penceToMollieAmount(pricePence),
      },
      interval: mollieInterval(newInterval),
      description: `${brand.productName} ${plans[newPlanId].name} (${intervalLabel(newInterval)})`,
      metadata: {
        workspaceId,
        planId: newPlanId,
        interval: newInterval,
      },
    },
  );

  await db
    .update(subscriptions)
    .set({
      planId: newPlanId,
      interval: newInterval,
      pendingPlanId: null,
      pendingInterval: null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, workspaceId));

  await db
    .update(workspaces)
    .set({
      planId: newPlanId,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId));
}

export async function handlePaymentUpdate(paymentId: string) {
  const mollie = getMollieClient();
  const payment = await mollie.payments.get(paymentId);
  const metadata = (payment.metadata ?? {}) as Record<string, string>;
  const workspaceId = metadata.workspaceId;

  if (!workspaceId) {
    throw new Error("Payment metadata is missing workspaceId.");
  }

  const mappedStatus = mapMolliePaymentStatus(payment.status);

  await upsertMolliePayment({
    workspaceId,
    molliePaymentId: payment.id,
    mollieCustomerId: payment.customerId ?? null,
    status: mappedStatus,
    amountValue: payment.amount.value,
    amountCurrency: payment.amount.currency,
    sequenceType: payment.sequenceType ?? null,
    description: payment.description ?? null,
    metadata: metadata as Record<string, unknown>,
    paidAt:
      payment.status === PaymentStatus.paid && payment.paidAt
        ? new Date(String(payment.paidAt))
        : null,
  });

  if (payment.status === PaymentStatus.paid) {
    return handlePaymentPaid(paymentId);
  }

  if (
    payment.status === PaymentStatus.failed ||
    payment.status === PaymentStatus.expired ||
    payment.status === PaymentStatus.canceled
  ) {
    const subscription = await getSubscriptionRow(workspaceId);

    if (
      payment.sequenceType === SequenceType.first &&
      subscription.status === "pending"
    ) {
      await db
        .update(subscriptions)
        .set({
          planId: "free",
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.workspaceId, workspaceId));

      await db
        .update(workspaces)
        .set({ planId: "free", updatedAt: new Date() })
        .where(eq(workspaces.id, workspaceId));
    } else if (subscription.mollieSubscriptionId) {
      await db
        .update(subscriptions)
        .set({
          status: "past_due",
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.workspaceId, workspaceId));
    }
  }

  return { processed: true, status: payment.status };
}

export async function handleSubscriptionWebhook(subscriptionId: string) {
  const mollie = getMollieClient();

  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.mollieSubscriptionId, subscriptionId))
    .limit(1);

  const local = rows[0];
  if (!local?.mollieCustomerId) {
    throw new Error("No local subscription found for Mollie subscription.");
  }

  const mollieSubscription = await mollie.customerSubscriptions.get(
    subscriptionId,
    { customerId: local.mollieCustomerId },
  );

  const idempotencyKey = `subscription:${subscriptionId}:${mollieSubscription.status}`;
  if (await hasProcessedEvent(idempotencyKey)) {
    return { processed: false, reason: "duplicate" as const };
  }

  await syncSubscriptionStatus(local.workspaceId, mollieSubscription);

  await recordSubscriptionEvent({
    workspaceId: local.workspaceId,
    subscriptionId: local.id,
    eventType: "subscription.updated",
    mollieResourceId: subscriptionId,
    payload: mollieSubscription,
    idempotencyKey,
  });

  return { processed: true };
}

type RemoteMollieSubscription = {
  status: MollieSubscriptionStatus;
  metadata?: unknown;
  startDate?: string | null;
};

export async function syncSubscriptionStatus(
  workspaceId: string,
  mollieSubscription?: RemoteMollieSubscription,
) {
  const local = await getSubscriptionRow(workspaceId);

  if (!local.mollieCustomerId || !local.mollieSubscriptionId) {
    return local;
  }

  const mollie = getMollieClient();
  const remote =
    mollieSubscription ??
    (await mollie.customerSubscriptions.get(local.mollieSubscriptionId, {
      customerId: local.mollieCustomerId,
    }));

  const metadata = (remote.metadata ?? {}) as Record<string, string>;
  const planId = (metadata.planId ?? local.planId) as PlanId;
  const interval = (metadata.interval ?? local.interval) as BillingInterval;
  const status = mapMollieSubscriptionStatus(remote.status);

  const periodStart = remote.startDate
    ? new Date(remote.startDate)
    : local.currentPeriodStart;
  const periodEnd = periodStart
    ? addBillingPeriod(periodStart, interval)
    : local.currentPeriodEnd;

  await db
    .update(subscriptions)
    .set({
      planId,
      interval,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, workspaceId));

  const effectivePlanId =
    status === "active" || status === "trialing" || status === "cancelled"
      ? planId
      : status === "past_due"
        ? planId
        : "free";

  await db
    .update(workspaces)
    .set({
      planId: effectivePlanId === "free" ? "free" : planId,
      updatedAt: new Date(),
    })
    .where(eq(workspaces.id, workspaceId));

  return getSubscriptionRow(workspaceId);
}

export async function cancelSubscription(workspaceId: string) {
  const subscription = await getSubscriptionRow(workspaceId);

  if (
    subscription.planId === "free" ||
    !subscription.mollieSubscriptionId ||
    !subscription.mollieCustomerId
  ) {
    throw new BillingError(
      "There is no active paid subscription to cancel.",
      "not_subscribed",
    );
  }

  if (subscription.cancelAtPeriodEnd) {
    return subscription;
  }

  const now = new Date();

  await db
    .update(subscriptions)
    .set({
      cancelAtPeriodEnd: true,
      cancelledAt: now,
      status: "cancelled",
      updatedAt: now,
    })
    .where(eq(subscriptions.workspaceId, workspaceId));

  const owner = await getWorkspaceOwner(workspaceId);
  if (owner?.email) {
    await sendEmail({
      to: owner.email,
      subject: "Your subscription has been cancelled",
      template: "subscription-cancelled",
      templateProps: {
        name: owner.name,
        planName: planDisplayName(subscription.planId),
        accessUntil: formatBillingDate(subscription.currentPeriodEnd),
      },
      workspaceId,
      userId: owner.userId,
      relatedType: "subscription",
      relatedId: subscription.id,
    });
  }

  return getSubscriptionRow(workspaceId);
}

export async function changePlan(input: {
  workspaceId: string;
  planId: PaidPlanId;
  interval: BillingInterval;
}) {
  const subscription = await getSubscriptionRow(input.workspaceId);

  if (
    subscription.planId === "free" ||
    !subscription.mollieSubscriptionId
  ) {
    throw new BillingError(
      "Start a subscription before changing plans.",
      "not_subscribed",
    );
  }

  if (
    subscription.planId === input.planId &&
    subscription.interval === input.interval &&
    !subscription.pendingPlanId
  ) {
    throw new BillingError(
      "You are already on this plan and billing interval.",
      "invalid_plan",
    );
  }

  const effectiveDate =
    subscription.currentPeriodEnd ?? addBillingPeriod(new Date(), subscription.interval);

  await db
    .update(subscriptions)
    .set({
      pendingPlanId: input.planId,
      pendingInterval: input.interval,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.workspaceId, input.workspaceId));

  const owner = await getWorkspaceOwner(input.workspaceId);
  if (owner?.email) {
    await sendEmail({
      to: owner.email,
      subject: "Your subscription change is scheduled",
      template: "subscription-changed",
      templateProps: {
        name: owner.name,
        previousPlan: planDisplayName(subscription.planId),
        newPlan: planDisplayName(input.planId),
        effectiveDate: formatBillingDate(effectiveDate),
      },
      workspaceId: input.workspaceId,
      userId: owner.userId,
      relatedType: "subscription",
      relatedId: subscription.id,
    });
  }

  return {
    subscription: await getSubscriptionRow(input.workspaceId),
    effectiveDate,
    policy:
      "Plan changes take effect at the start of your next billing period. We do not charge immediately for upgrades or issue partial refunds for downgrades.",
  };
}

export async function getBillingHistory(workspaceId: string) {
  const payments = await db
    .select()
    .from(molliePayments)
    .where(eq(molliePayments.workspaceId, workspaceId))
    .orderBy(desc(molliePayments.createdAt))
    .limit(50);

  return payments.map((payment) => ({
    id: payment.id,
    molliePaymentId: payment.molliePaymentId,
    status: payment.status,
    amountValue: payment.amountValue,
    amountCurrency: payment.amountCurrency,
    description: payment.description,
    sequenceType: payment.sequenceType,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  }));
}

export async function getPaymentReturnStatus(workspaceId: string) {
  const [latestPayment] = await db
    .select()
    .from(molliePayments)
    .where(eq(molliePayments.workspaceId, workspaceId))
    .orderBy(desc(molliePayments.createdAt))
    .limit(1);

  if (!latestPayment) {
    return {
      state: "unknown" as const,
      message: "No recent payment was found for this workspace.",
    };
  }

  const mollie = getMollieClient();
  const payment = await mollie.payments.get(latestPayment.molliePaymentId);
  const mapped = mapMolliePaymentStatus(payment.status);

  if (mapped === "paid") {
    await handlePaymentPaid(payment.id);
    return {
      state: "success" as const,
      paymentId: payment.id,
      message: "Payment received. Your subscription is being activated.",
    };
  }

  if (mapped === "pending") {
    return {
      state: "pending" as const,
      paymentId: payment.id,
      message:
        "Your payment is still being processed. This page will update shortly.",
    };
  }

  return {
    state: "failed" as const,
    paymentId: payment.id,
    message:
      "We could not confirm your payment. You have not been charged for a subscription.",
  };
}

export async function processMollieWebhookResource(resourceId: string) {
  try {
    if (resourceId.startsWith("tr_")) {
      return handlePaymentUpdate(resourceId);
    }

    if (resourceId.startsWith("sub_")) {
      return handleSubscriptionWebhook(resourceId);
    }

    logger.warn({ resourceId }, "Unhandled Mollie webhook resource type");
    return { processed: false, reason: "unsupported_resource" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logWebhookFailure(resourceId, { resourceId }, message);
    logger.error({ err: error, resourceId }, "Mollie webhook processing failed");
    throw error;
  }
}

export async function getSubscriptionDetails(workspaceId: string) {
  return getSubscriptionRow(workspaceId);
}
