"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BillingInterval, PlanId } from "@/config/brand";

type CheckoutButtonProps = {
  planId: PlanId;
  interval: BillingInterval;
  label?: string;
  variant?: "upgrade" | "change";
};

export function CheckoutButton({
  planId,
  interval,
  label,
  variant = "upgrade",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setError(null);

    try {
      const endpoint =
        variant === "change" ? "/api/billing/change-plan" : "/api/billing/checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        return;
      }

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      if (variant === "change") {
        window.location.reload();
        return;
      }

      setError(json.message ?? "Checkout is not available.");
    } catch {
      setError("We could not start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        className="w-full"
        disabled={loading}
        onClick={checkout}
      >
        {loading ? "Please wait…" : (label ?? "Upgrade")}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
