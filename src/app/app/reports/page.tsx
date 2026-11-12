import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { TimeFilter } from "@/components/app/time-filter";
import { UpgradePrompt } from "@/components/app/upgrade-prompt";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireAppContext } from "@/lib/app-context";
import { membershipSubscriptionStatus } from "@/lib/billing/access";
import { resolveDateRange, type DateRangePreset } from "@/lib/date-ranges";
import { canUseReports } from "@/lib/entitlements";
import { getReportSummary } from "@/lib/services/reports";
import { formatMoney } from "@/lib/money";

type PageProps = {
  searchParams: Promise<{
    range?: DateRangePreset;
    from?: string;
    to?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { membership } = await requireAppContext();

  if (
    !canUseReports(
      membership.workspace.planId,
      membershipSubscriptionStatus(membership),
    )
  ) {
    return (
      <div>
        <PageHeader title="Reports" description="Business summaries and CSV exports." />
        <UpgradePrompt
          title="Reports available on Pro"
          description="Upgrade to access invoicing summaries and CSV exports."
          feature="Reports"
        />
      </div>
    );
  }

  const range = resolveDateRange(params.range ?? "this_month", params.from, params.to);
  const summary = await getReportSummary(membership.workspaceId, range);

  const stats = [
    { label: "Total invoiced", value: formatMoney(summary.invoicedMinor) },
    { label: "Collected", value: formatMoney(summary.collectedMinor) },
    { label: "Outstanding", value: formatMoney(summary.outstandingMinor) },
    { label: "Overdue", value: formatMoney(summary.overdueMinor) },
    { label: "Invoice count", value: String(summary.invoiceCount) },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Summaries from your issued invoices. Not accounting advice."
        actions={
          <Button asChild variant="outline">
            <a
              href={`/api/reports/export?range=${params.range ?? "this_month"}&from=${params.from ?? ""}&to=${params.to ?? ""}`}
            >
              Export CSV
            </a>
          </Button>
        }
      />

      <Suspense fallback={null}>
        <TimeFilter />
      </Suspense>

      <Alert className="mt-4">
        <AlertDescription>
          These figures are derived from user-entered invoice and payment data in
          InvoiceX. They do not constitute accounting, tax, or financial advice.
          Outstanding amounts are not guaranteed revenue.
        </AlertDescription>
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground-muted">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
