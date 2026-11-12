import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InvoiceStatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/app-context";
import { listInvoices } from "@/lib/services/invoices";
import { formatMoney } from "@/lib/money";
import type { PaymentDerivedStatus } from "@/lib/document-status";

export default async function InvoicesPage() {
  const { membership } = await requireAppContext();
  const result = await listInvoices(membership.workspaceId, {
    page: 1,
    pageSize: 50,
    order: "desc",
  });

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="Create, send, and track invoices. Status badges reflect payment and due dates."
        actions={
          <Button asChild>
            <Link href="/app/invoices/new">
              <Plus className="size-4" />
              New invoice
            </Link>
          </Button>
        }
      />

      {result.items.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-5" />}
          title="No invoices yet"
          description="Create your first invoice to start billing clients."
          action={
            <Button asChild>
              <Link href="/app/invoices/new">Create invoice</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issue date</TableHead>
              <TableHead>Due date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Link
                    href={`/app/invoices/${invoice.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {invoice.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell className="text-foreground-muted">{invoice.issueDate}</TableCell>
                <TableCell className="text-foreground-muted">{invoice.dueDate}</TableCell>
                <TableCell className="font-tabular">
                  {formatMoney(invoice.grandTotalMinor, invoice.currency)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge
                    status={invoice.derivedStatus as PaymentDerivedStatus}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
