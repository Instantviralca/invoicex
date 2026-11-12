import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/app-context";
import { getPaymentReturnStatus } from "@/lib/mollie/subscriptions";

export default async function SubscriptionReturnPage() {
  const { membership } = await requireAppContext();
  const result = await getPaymentReturnStatus(membership.workspaceId);

  const title =
    result.state === "success"
      ? "Payment confirmed"
      : result.state === "pending"
        ? "Payment pending"
        : "Payment not confirmed";

  return (
    <div>
      <PageHeader
        title={title}
        description="We verify your payment directly with Mollie — not from the redirect alone."
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {result.state === "success"
              ? "Thank you"
              : result.state === "pending"
                ? "Almost there"
                : "Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{result.message}</p>
          {"paymentId" in result && result.paymentId ? (
            <p className="text-foreground-muted">
              Payment reference: {result.paymentId}
            </p>
          ) : null}
          {result.state === "pending" ? (
            <p className="text-foreground-muted">
              If this takes more than a few minutes, use Refresh billing status on your
              Subscription page or contact support with the payment reference above.
            </p>
          ) : null}
          <Button asChild>
            <Link href="/app/subscription">Back to subscription</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
