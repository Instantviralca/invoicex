"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatPriceFromPence,
  plans,
  pricingNotes,
  type BillingInterval,
  type PlanId,
} from "@/config/brand";
import { cn } from "@/lib/utils";

const planOrder: PlanId[] = ["free", "starter", "pro", "business"];

type PricingCardsProps = {
  showNotes?: boolean;
  compact?: boolean;
  className?: string;
};

function annualSavingsPercent(planId: PlanId): number | null {
  const plan = plans[planId];
  if (plan.priceMonthlyPence === 0) return null;
  const monthlyTotal = plan.priceMonthlyPence * 12;
  const savings = monthlyTotal - plan.priceAnnualPence;
  if (savings <= 0) return null;
  return Math.round((savings / monthlyTotal) * 100);
}

function annualSavingsAmount(planId: PlanId): number | null {
  const plan = plans[planId];
  if (plan.priceMonthlyPence === 0) return null;
  const savings = plan.priceMonthlyPence * 12 - plan.priceAnnualPence;
  return savings > 0 ? savings : null;
}

export function PricingCards({
  showNotes = true,
  compact = false,
  className,
}: PricingCardsProps) {
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <div className={className}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="inline-flex rounded-full border border-border-soft bg-background-elevated p-1 shadow-sm"
          role="group"
          aria-label="Billing interval"
        >
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-all",
              interval === "month"
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={cn(
              "rounded-full px-5 py-2 text-sm font-semibold transition-all",
              interval === "year"
                ? "bg-brand text-brand-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            Annual
          </button>
        </div>
        {interval === "year" ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
            <Sparkles className="size-4" aria-hidden />
            Save up to 17% with annual billing
          </p>
        ) : (
          <p className="text-sm text-foreground-muted">
            Switch to annual billing to save on paid plans
          </p>
        )}
      </div>

      <div
        className={cn(
          "mt-10 grid gap-6",
          compact ? "sm:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {planOrder.map((planId) => {
          const plan = plans[planId];
          const pricePence =
            interval === "year"
              ? plan.priceAnnualPence
              : plan.priceMonthlyPence;
          const isFree = planId === "free";
          const monthlyEquivalent =
            interval === "year" && !isFree
              ? Math.round(plan.priceAnnualPence / 12)
              : null;
          const savingsPercent = interval === "year" ? annualSavingsPercent(planId) : null;
          const savingsAmount = interval === "year" ? annualSavingsAmount(planId) : null;

          return (
            <div
              key={planId}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-background-elevated p-6 transition-shadow",
                plan.highlighted
                  ? "z-10 border-brand/40 shadow-glow ring-1 ring-brand/25 lg:scale-[1.02]"
                  : "border-border-soft shadow-sm",
              )}
            >
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-brand-foreground shadow-md">
                  <Sparkles className="size-3" aria-hidden />
                  Most popular
                </span>
              ) : null}

              <h3 className="font-display text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-2 min-h-[2.5rem] text-sm leading-relaxed text-foreground-muted">
                {plan.description}
              </p>

              <div className="mt-6 border-b border-border-soft pb-6">
                <p className="font-display text-3xl font-semibold font-tabular text-foreground">
                  {formatPriceFromPence(pricePence)}
                  {!isFree ? (
                    <span className="text-base font-normal text-foreground-muted">
                      /{interval === "year" ? "year" : "month"}
                    </span>
                  ) : null}
                </p>
                {monthlyEquivalent ? (
                  <p className="mt-1.5 text-sm text-foreground-muted">
                    Equivalent to{" "}
                    <span className="font-semibold font-tabular text-foreground">
                      {formatPriceFromPence(monthlyEquivalent)}
                    </span>{" "}
                    per month
                  </p>
                ) : null}
                {savingsAmount && savingsPercent ? (
                  <p className="mt-2 inline-flex rounded-full bg-success-muted px-2.5 py-0.5 text-xs font-semibold text-success">
                    Save {formatPriceFromPence(savingsAmount)} ({savingsPercent}%)
                  </p>
                ) : null}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-2.5 text-sm leading-relaxed text-foreground-muted"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className="mt-8 w-full"
                variant={plan.highlighted ? "default" : "outline"}
                size={plan.highlighted ? "lg" : "default"}
              >
                <Link href={isFree ? "/register" : `/register?plan=${planId}`}>
                  {isFree ? "Start free" : `Choose ${plan.name}`}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      {showNotes ? (
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="surface-card space-y-3 p-5 text-sm leading-relaxed text-foreground-muted">
            <p className="font-semibold text-foreground">VAT and billing</p>
            <p>{pricingNotes.vatNote}</p>
            <p>{pricingNotes.renewal}</p>
          </div>
          <div className="surface-card space-y-3 p-5 text-sm leading-relaxed text-foreground-muted">
            <p className="font-semibold text-foreground">Cancellation and payments</p>
            <p>{pricingNotes.cancellation}</p>
            <p>{pricingNotes.freePlan}</p>
            <p>{pricingNotes.processor}</p>
          </div>
          <div className="surface-card space-y-3 p-5 text-sm leading-relaxed text-foreground-muted sm:col-span-2">
            <p className="font-semibold text-foreground">Fair use and policies</p>
            <p>{pricingNotes.fairUse}</p>
            <p>
              Refunds are handled in line with our{" "}
              <Link href="/refund-policy" className="font-medium text-brand hover:underline">
                Refund Policy
              </Link>
              . Subscription cancellation is explained in our{" "}
              <Link
                href="/subscription-cancellation"
                className="font-medium text-brand hover:underline"
              >
                Subscription Cancellation Policy
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
