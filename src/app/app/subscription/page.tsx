import { PageHeader } from "@/components/app/page-header";
import { SubscriptionActions } from "@/components/app/subscription-actions";
import { SubscriptionBillingHistory } from "@/components/app/subscription-billing-history";
import { SubscriptionPlanCards } from "@/components/app/subscription-plan-cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatPriceFromPence,
  plans,
  pricingNotes,
} from "@/config/brand";
import { requireAppContext } from "@/lib/app-context";
import {
  billingStatusLabel,
  formatBillingDate,
  intervalLabel,
  membershipSubscriptionStatus,
  planDisplayName,
} from "@/lib/billing/access";
import { getEffectivePlanLimits } from "@/lib/entitlements";
import { hasPermission } from "@/lib/permissions";
import { getUsageForPeriod } from "@/lib/services/usage";
import { cn } from "@/lib/utils";

export default async function SubscriptionPage() {
  const { membership } = await requireAppContext();
  const planId = membership.workspace.planId;
  const subscription = membership.subscription;
  const subscriptionStatus = membershipSubscriptionStatus(membership);
  const plan = plans[planId];
  const limits = getEffectivePlanLimits(planId, subscriptionStatus);
  const usage = await getUsageForPeriod(membership.workspaceId);
  const canManageBilling = hasPermission(membership.role, "billing:manage");
  const hasActivePaidSubscription =
    planId !== "free" &&
    (subscriptionStatus === "active" || subscriptionStatus === "cancelled");

  const currentPricePence =
    subscription?.interval === "year"
      ? plan.priceAnnualPence
      : plan.priceMonthlyPence;

  return (
    <div>
      <PageHeader
        title="Subscription"
        description="Your plan, billing status, usage, and upgrade options."
      />

      <Card className="mb-8 overflow-hidden border-border-soft shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border-soft bg-background-muted/30">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
              Current plan
            </p>
            <CardTitle className="mt-1">{plan.name}</CardTitle>
            <p className="mt-1 text-sm text-foreground-muted">{plan.description}</p>
          </div>
          {subscription ? (
            <Badge
              variant={subscription.status === "active" ? "default" : "secondary"}
              className="shrink-0"
            >
              {billingStatusLabel(subscription.status)}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6 pt-6 text-sm">
          {planId !== "free" ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-border-soft bg-background px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                  Billing
                </dt>
                <dd className="mt-1 font-tabular font-medium text-foreground">
                  {formatPriceFromPence(currentPricePence)} /{" "}
                  {subscription?.interval === "year" ? "year" : "month"} (
                  {intervalLabel(subscription?.interval ?? "month")})
                </dd>
              </div>
              <div className="rounded-lg border border-border-soft bg-background px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                  Current period ends
                </dt>
                <dd className="mt-1 font-medium text-foreground">
                  {formatBillingDate(subscription?.currentPeriodEnd)}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="rounded-lg border border-border-soft bg-background-muted/40 px-4 py-3 text-foreground-muted">
              {pricingNotes.freePlan}
            </p>
          )}

          {(subscription?.cancelAtPeriodEnd ||
            subscription?.pendingPlanId ||
            subscriptionStatus === "past_due") && (
            <div className="space-y-2 rounded-lg border border-border-soft bg-background px-4 py-3">
              {subscription?.cancelAtPeriodEnd ? (
                <p className="text-warning">
                  Cancellation scheduled. Access continues until{" "}
                  {formatBillingDate(subscription.currentPeriodEnd)}.
                </p>
              ) : null}
              {subscription?.pendingPlanId ? (
                <p className="text-foreground-muted">
                  Scheduled change to {planDisplayName(subscription.pendingPlanId)} (
                  {intervalLabel(subscription.pendingInterval ?? subscription.interval)}) on{" "}
                  {formatBillingDate(subscription.currentPeriodEnd)}.
                </p>
              ) : null}
              {subscriptionStatus === "past_due" ? (
                <p className="text-destructive">
                  Your last payment failed. Existing data remains available, but new paid
                  features are restricted until payment succeeds.
                </p>
              ) : null}
            </div>
          )}

          <dl className="grid gap-4 sm:grid-cols-2">
            <div
              className={cn(
                "rounded-lg border border-l-4 border-border-soft border-l-brand bg-brand-muted/20 px-4 py-3",
              )}
            >
              <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Documents this month
              </dt>
              <dd className="mt-1 font-tabular font-medium text-foreground">
                {limits.documentsPerMonth === null
                  ? `${usage.documentsCreated} (unlimited fair use)`
                  : `${usage.documentsCreated} / ${limits.documentsPerMonth}`}
              </dd>
            </div>
            <div className="rounded-lg border border-l-4 border-border-soft border-l-accent bg-accent-muted/30 px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                Emails this month
              </dt>
              <dd className="mt-1 font-tabular font-medium text-foreground">
                {usage.emailsSent}
              </dd>
            </div>
          </dl>

          <div className="border-t border-border-soft pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
              Billing actions
            </p>
            <SubscriptionActions
              canManageBilling={canManageBilling}
              cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd ?? false}
              hasPaidSubscription={planId !== "free" && Boolean(subscription)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Plans</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            Compare plans and change your subscription when you are ready.
          </p>
        </div>
        <SubscriptionPlanCards
          currentPlanId={planId}
          currentInterval={subscription?.interval ?? "month"}
          hasActivePaidSubscription={hasActivePaidSubscription}
          pendingPlanId={subscription?.pendingPlanId ?? null}
          pendingInterval={subscription?.pendingInterval ?? null}
          canManageBilling={canManageBilling}
        />
      </div>

      {canManageBilling ? (
        <div className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Billing history
          </h2>
          <SubscriptionBillingHistory />
        </div>
      ) : null}
    </div>
  );
}
