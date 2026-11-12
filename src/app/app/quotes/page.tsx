import Link from "next/link";
import { FileStack, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { QuoteStatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/app-context";
import { listQuotes } from "@/lib/services/quotes";
import { formatMoney } from "@/lib/money";
import type { QuoteStatus } from "@/lib/document-status";

export default async function QuotesPage() {
  const { membership } = await requireAppContext();
  const result = await listQuotes(membership.workspaceId, {
    page: 1,
    pageSize: 50,
    order: "desc",
  });

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Send quotations and convert accepted quotes to invoices."
        actions={
          <Button asChild>
            <Link href="/app/quotes/new">
              <Plus className="size-4" />
              New quote
            </Link>
          </Button>
        }
      />

      {result.items.length === 0 ? (
        <EmptyState
          icon={<FileStack className="size-5" />}
          title="No quotes yet"
          description="Create a quote to share pricing with a client."
          action={
            <Button asChild>
              <Link href="/app/quotes/new">Create quote</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Valid until</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>
                  <Link
                    href={`/app/quotes/${quote.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {quote.quoteNumber}
                  </Link>
                </TableCell>
                <TableCell>{quote.clientName}</TableCell>
                <TableCell className="text-foreground-muted">{quote.validUntil}</TableCell>
                <TableCell className="font-tabular">
                  {formatMoney(quote.grandTotalMinor, quote.currency)}
                </TableCell>
                <TableCell>
                  <QuoteStatusBadge status={quote.derivedStatus as QuoteStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
