import Link from "next/link";
import { Suspense } from "react";
import { FileText, Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { TimeFilter } from "@/components/app/time-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceStatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireAppContext } from "@/lib/app-context";
import { resolveDateRange, type DateRangePreset } from "@/lib/date-ranges";
import {
  getDashboardStats,
  getDueSoonInvoices,
  getMonthlyActivity,
  getRecentDocuments,
} from "@/lib/services/dashboard";
import { formatMoney } from "@/lib/money";
import type { PaymentDerivedStatus } from "@/lib/document-status";
import { cn } from "@/lib/utils";

type PageProps = {
  searchParams: Promise<{
    range?: DateRangePreset;
    from?: string;
    to?: string;
  }>;
};

const statAccentClasses = {
  brand: "border-l-brand bg-brand-muted/20",
  success: "border-l-success bg-success-muted/30",
  warning: "border-l-warning bg-warning-muted/30",
  destructive: "border-l-destructive bg-destructive-muted/30",
  neutral: "border-l-border-strong bg-background-muted/40",
} as const;

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { membership } = await requireAppContext();
  const workspaceId = membership.workspaceId;
  const range = resolveDateRange(
    params.range ?? "this_month",
    params.from,
    params.to,
  );

  const [stats, recent, dueSoon, activity] = await Promise.all([
    getDashboardStats(workspaceId, range),
    getRecentDocuments(workspaceId),
    getDueSoonInvoices(workspaceId),
    getMonthlyActivity(workspaceId),
  ]);

  const statCards = [
    {
      label: "Total invoiced",
      value: formatMoney(stats.totalInvoicedMinor),
      hint: range.label,
      accent: "brand" as const,
    },
    {
      label: "Marked paid",
      value: formatMoney(stats.markedPaidMinor),
      hint: "Recorded payments",
      accent: "success" as const,
    },
    {
      label: "Outstanding",
      value: formatMoney(stats.outstandingMinor),
      hint: "Unpaid balance",
      accent: "warning" as const,
    },
    {
      label: "Overdue",
      value: formatMoney(stats.overdueMinor),
      hint: "Past due date",
      accent: "destructive" as const,
    },
    {
      label: "Drafts",
      value: String(stats.draftsCount),
      hint: "Not yet sent",
      accent: "neutral" as const,
    },
  ];

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Overview"
        description="Your workspace at a glance. Figures reflect invoices in the selected period."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/app/invoices/new">
                <Plus className="size-4" />
                New invoice
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/app/clients/new">
                <Users className="size-4" />
                Add client
              </Link>
            </Button>
          </div>
        }
      />

      <Suspense fallback={null}>
        <TimeFilter />
      </Suspense>

      <Alert className="mt-4 border-border-soft bg-background-sky/40">
        <AlertDescription className="text-foreground-muted">
          Outstanding amounts show unpaid invoice balances and are not guaranteed
          revenue. Payment records are user-entered unless otherwise stated.
        </AlertDescription>
      </Alert>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className={cn(
              "border-l-4 shadow-sm",
              statAccentClasses[card.accent],
            )}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-tabular text-2xl font-semibold text-foreground">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-foreground-subtle">{card.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-heading">
          <h2
            id="recent-heading"
            className="mb-4 font-display text-lg font-semibold text-foreground"
          >
            Recent invoices & quotes
          </h2>
          {recent.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No documents yet"
              description="Create your first invoice or quote to see activity here."
              action={
                <Button asChild>
                  <Link href="/app/invoices/new">Create invoice</Link>
                </Button>
              }
            />
          ) : (
            <ul className="surface-card divide-y divide-border-soft overflow-hidden p-0">
              {recent.map((doc) => (
                <li key={`${doc.type}-${doc.id}`}>
                  <Link
                    href={`/app/${doc.type === "invoice" ? "invoices" : "quotes"}/${doc.id}`}
                    className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-background-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{doc.number}</p>
                      <p className="text-sm text-foreground-muted">{doc.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-tabular font-medium">
                        {formatMoney(doc.grandTotalMinor, doc.currency)}
                      </p>
                      {doc.type === "invoice" ? (
                        <InvoiceStatusBadge
                          status={doc.status as PaymentDerivedStatus}
                          showDot={false}
                        />
                      ) : (
                        <span className="text-xs capitalize text-foreground-muted">
                          {doc.status}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="due-soon-heading">
          <h2
            id="due-soon-heading"
            className="mb-4 font-display text-lg font-semibold text-foreground"
          >
            Due soon & overdue
          </h2>
          {dueSoon.length === 0 ? (
            <EmptyState
              title="Nothing due imminently"
              description="Sent invoices approaching or past their due date will appear here."
            />
          ) : (
            <ul className="surface-card divide-y divide-border-soft overflow-hidden p-0">
              {dueSoon.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/app/invoices/${inv.id}`}
                    className="flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-background-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{inv.invoiceNumber}</p>
                      <p className="text-sm text-foreground-muted">{inv.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground-muted">Due {inv.dueDate}</p>
                      <InvoiceStatusBadge status={inv.derivedStatus} showDot={false} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8" aria-labelledby="activity-heading">
        <h2
          id="activity-heading"
          className="mb-4 font-display text-lg font-semibold text-foreground"
        >
          Monthly activity
        </h2>
        {activity.length === 0 ? (
          <EmptyState
            title="No activity to chart"
            description="Issued invoices over the last six months will appear here."
          />
        ) : (
          <MonthlyActivityChart activity={activity} />
        )}
      </section>
    </div>
  );
}

function MonthlyActivityChart({
  activity,
}: {
  activity: { month: string; invoicedMinor: number; paidMinor: number }[];
}) {
  const max = Math.max(...activity.map((a) => a.invoicedMinor), 1);

  return (
    <div className="surface-card p-5 sm:p-6">
      <div
        className="flex items-end justify-start gap-4 overflow-x-auto pb-2"
        role="img"
        aria-label="Bar chart of monthly invoiced and paid amounts"
      >
        {activity.map((row) => {
          const invoicedHeight = Math.round((row.invoicedMinor / max) * 128);
          const paidHeight = Math.round((row.paidMinor / max) * 128);
          return (
            <div key={row.month} className="flex min-w-[76px] flex-col items-center gap-2">
              <div className="flex h-32 items-end gap-1.5 rounded-t-lg bg-background-muted/50 px-2 pt-2">
                <div
                  className="w-4 rounded-t-md bg-brand shadow-xs transition-all"
                  style={{ height: `${Math.max(invoicedHeight, 4)}px` }}
                  title={`Invoiced: ${formatMoney(row.invoicedMinor)}`}
                />
                <div
                  className="w-4 rounded-t-md bg-success shadow-xs transition-all"
                  style={{ height: `${Math.max(paidHeight, 4)}px` }}
                  title={`Paid: ${formatMoney(row.paidMinor)}`}
                />
              </div>
              <span className="text-xs font-medium text-foreground-muted">{row.month}</span>
            </div>
          );
        })}
      </div>
      <table className="mt-4 w-full text-sm sr-only">
        <caption>Monthly invoiced and paid totals</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Invoiced</th>
            <th scope="col">Paid</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((row) => (
            <tr key={row.month}>
              <td>{row.month}</td>
              <td>{formatMoney(row.invoicedMinor)}</td>
              <td>{formatMoney(row.paidMinor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex flex-wrap gap-5 border-t border-border-soft pt-4 text-xs text-foreground-muted">
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-brand" aria-hidden="true" />
          Invoiced
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 rounded-sm bg-success" aria-hidden="true" />
          Paid
        </span>
      </div>
    </div>
  );
}
