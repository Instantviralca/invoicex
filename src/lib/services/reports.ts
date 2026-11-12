import { and, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";
import { type DateRange, toDateString } from "@/lib/date-ranges";
import { deriveInvoiceStatus } from "@/lib/document-status";
import { outstandingBalance } from "@/lib/money";
import { getWorkspaceSubscriptionStatus } from "@/lib/billing/access";
import { canUseReports } from "@/lib/entitlements";

export async function assertReportsAccess(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
) {
  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);
  if (!canUseReports(planId, subscriptionStatus)) {
    throw new Error("Reports require a Pro plan or higher.");
  }
}

export async function getReportSummary(workspaceId: string, range: DateRange) {
  const from = toDateString(range.from);
  const to = toDateString(range.to);

  const rows = await db
    .select({
      invoice: invoices,
      clientName: clients.contactName,
      businessName: clients.businessName,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        gte(invoices.issueDate, from),
        lte(invoices.issueDate, to),
        ne(invoices.status, "void"),
      ),
    );

  let invoicedMinor = 0;
  let collectedMinor = 0;
  let outstandingMinor = 0;
  let overdueMinor = 0;

  for (const { invoice } of rows) {
    if (invoice.status === "draft") continue;
    invoicedMinor += invoice.grandTotalMinor;
    collectedMinor += invoice.amountPaidMinor;
    const outstanding = outstandingBalance(
      invoice.grandTotalMinor,
      invoice.amountPaidMinor,
    );
    if (outstanding > 0) {
      outstandingMinor += outstanding;
      const status = deriveInvoiceStatus({
        baseStatus: invoice.status,
        dueDate: invoice.dueDate,
        amountPaidMinor: invoice.amountPaidMinor,
        grandTotalMinor: invoice.grandTotalMinor,
      });
      if (status === "overdue") overdueMinor += outstanding;
    }
  }

  return {
    invoicedMinor,
    collectedMinor,
    outstandingMinor,
    overdueMinor,
    invoiceCount: rows.filter((r) => r.invoice.status !== "draft").length,
  };
}

export async function exportReportCsv(workspaceId: string, range: DateRange) {
  const from = toDateString(range.from);
  const to = toDateString(range.to);

  const rows = await db
    .select({
      invoiceNumber: invoices.invoiceNumber,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      status: invoices.status,
      grandTotalMinor: invoices.grandTotalMinor,
      amountPaidMinor: invoices.amountPaidMinor,
      taxTotalMinor: invoices.taxTotalMinor,
      clientName: clients.contactName,
      businessName: clients.businessName,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        gte(invoices.issueDate, from),
        lte(invoices.issueDate, to),
        ne(invoices.status, "void"),
        ne(invoices.status, "draft"),
      ),
    )
    .orderBy(invoices.issueDate);

  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

  const header =
    "invoice_number,client,issue_date,due_date,status,total_minor,paid_minor,tax_minor,outstanding_minor";

  const lines = rows.map((r) => {
    const outstanding = outstandingBalance(r.grandTotalMinor, r.amountPaidMinor);
    const derived = deriveInvoiceStatus({
      baseStatus: r.status,
      dueDate: r.dueDate,
      amountPaidMinor: r.amountPaidMinor,
      grandTotalMinor: r.grandTotalMinor,
    });
    return [
      r.invoiceNumber,
      r.businessName ?? r.clientName,
      r.issueDate,
      r.dueDate,
      derived,
      r.grandTotalMinor,
      r.amountPaidMinor,
      r.taxTotalMinor,
      outstanding,
    ]
      .map(escape)
      .join(",");
  });

  return [header, ...lines].join("\n");
}
