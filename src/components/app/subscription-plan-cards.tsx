"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  formatPriceFromPence,
  plans,
  pricingNotes,
  type BillingInterval,
  type PlanId,
} from "@/config/brand";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "@/components/app/checkout-button";

const paidPlans = ["starter", "pro", "business"] as const;

type SubscriptionPlanCardsProps = {
  currentPlanId: PlanId;
  currentInterval: BillingInterval;
  hasActivePaidSubscription: boolean;
  pendingPlanId: PlanId | null;
  pendingInterval: BillingInterval | null;
  canManageBilling: boolean;
};

export function SubscriptionPlanCards({
  currentPlanId,
  currentInterval,
  hasActivePaidSubscription,
  pendingPlanId,
  pendingInterval,
  canManageBilling,
}: SubscriptionPlanCardsProps) {
  const [interval, setInterval] = useState<BillingInterval>(currentInterval);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="inline-flex rounded-lg border border-border bg-background-muted p-1"
          role="group"
          aria-label="Billing interval"
        >
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              interval === "month"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              interval === "year"
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            Annual
          </button>
        </div>
        <p className="text-sm text-foreground-muted">{pricingNotes.processor}</p>
      </div>

      {hasActivePaidSubscription ? (
        <p className="mb-4 rounded-md border border-border bg-background-muted p-3 text-sm text-foreground-muted">
          Plan changes apply at the start of your next billing period. We do not charge
          immediately for upgrades or issue partial refunds for downgrades, because Mollie
          proration is not reliable for every payment method.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paidPlans.map((id) => {
          const plan = plans[id];
          const pricePence =
            interval === "year" ? plan.priceAnnualPence : plan.priceMonthlyPence;
          const isCurrent =
            id === currentPlanId && interval === currentInterval;
          const isPending =
            pendingPlanId === id &&
            (pendingInterval ?? currentInterval) === interval;

          return (
            <Card key={id} className={plan.highlighted ? "border-brand" : undefined}>
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-2xl font-semibold">
                  {formatPriceFromPence(pricePence)}
                  <span className="text-sm font-normal text-foreground-muted">
                    /{interval === "year" ? "year" : "month"}
                  </span>
                </p>
                <ul className="space-y-1 text-sm text-foreground-muted">
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>

                {!canManageBilling ? (
                  <Button disabled className="w-full">
                    Owner access required
                  </Button>
                ) : isCurrent ? (
                  <Button disabled className="w-full">
                    Current plan
                  </Button>
                ) : isPending ? (
                  <Button disabled className="w-full">
                    Change scheduled
                  </Button>
                ) : hasActivePaidSubscription ? (
                  <CheckoutButton
                    planId={id}
                    interval={interval}
                    variant="change"
                    label={pricePence > getCurrentPrice(currentPlanId, currentInterval) ? "Upgrade" : "Downgrade"}
                  />
                ) : (
                  <CheckoutButton planId={id} interval={interval} label="Subscribe" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getCurrentPrice(planId: PlanId, interval: BillingInterval): number {
  const plan = plans[planId];
  return interval === "year" ? plan.priceAnnualPence : plan.priceMonthlyPence;
}
