"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPriceFromPence } from "@/config/brand";

type PaymentRow = {
  id: string;
  molliePaymentId: string;
  status: string;
  amountValue: string;
  amountCurrency: string;
  description: string | null;
  paidAt: string | null;
  createdAt: string;
};

export function SubscriptionBillingHistory() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/billing/history");
        const json = await res.json();
        if (!res.ok) {
          setError(json.error ?? "Could not load billing history.");
          return;
        }
        setPayments(json.payments ?? []);
      } catch {
        setError("Could not load billing history.");
      }
    }

    void loadHistory();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing history</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : payments.length === 0 ? (
          <p className="text-sm text-foreground-muted">No payments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-foreground-muted">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Description</th>
                  <th className="py-2 pr-4 font-medium">Amount</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border/60">
                    <td className="py-3 pr-4">
                      {formatDate(payment.paidAt ?? payment.createdAt)}
                    </td>
                    <td className="py-3 pr-4">
                      {payment.description ?? "Subscription payment"}
                    </td>
                    <td className="py-3 pr-4">
                      {formatPriceFromPence(
                        Math.round(Number(payment.amountValue) * 100),
                        payment.amountCurrency,
                      )}
                    </td>
                    <td className="py-3 capitalize">{payment.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
