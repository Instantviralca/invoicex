"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type SubscriptionActionsProps = {
  canManageBilling: boolean;
  cancelAtPeriodEnd: boolean;
  hasPaidSubscription: boolean;
};

export function SubscriptionActions({
  canManageBilling,
  cancelAtPeriodEnd,
  hasPaidSubscription,
}: SubscriptionActionsProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (!canManageBilling || !hasPaidSubscription) {
    return null;
  }

  async function cancelSubscription() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setMessage(json.error ?? "Cancellation failed.");
        return;
      }

      setMessage(json.message);
      setOpen(false);
      window.location.reload();
    } catch {
      setMessage("We could not cancel your subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function syncSubscription() {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/billing/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        setMessage(json.error ?? "Sync failed.");
        return;
      }

      window.location.reload();
    } catch {
      setMessage("We could not refresh your subscription status.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="outline" disabled={loading} onClick={syncSubscription}>
        Refresh billing status
      </Button>

      {!cancelAtPeriodEnd ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="destructive" disabled={loading}>
              Cancel subscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel subscription</DialogTitle>
              <DialogDescription>
                Your subscription will remain active until the end of the current billing
                period. You will not be charged again, and no partial refund is issued for
                unused time. Your existing invoices, clients, and documents will remain
                available.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Keep subscription
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading}
                onClick={cancelSubscription}
              >
                Confirm cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      {message ? <p className="w-full text-sm text-foreground-muted">{message}</p> : null}
    </div>
  );
}
