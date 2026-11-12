import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices, quotes } from "@/db/schema";
import { type DateRange, toDateString } from "@/lib/date-ranges";
import { deriveInvoiceStatus } from "@/lib/document-status";
import { outstandingBalance } from "@/lib/money";

export type DashboardStats = {
  totalInvoicedMinor: number;
  markedPaidMinor: number;
  outstandingMinor: number;
  overdueMinor: number;
  draftsCount: number;
};

export type DashboardDocument = {
  id: string;
  number: string;
  clientName: string;
  grandTotalMinor: number;
  currency: string;
  status: string;
  date: string;
  type: "invoice" | "quote";
};

export type MonthlyActivity = {
  month: string;
  invoicedMinor: number;
  paidMinor: number;
};

export async function getDashboardStats(
  workspaceId: string,
  range: DateRange,
): Promise<DashboardStats> {
  const from = toDateString(range.from);
  const to = toDateString(range.to);

  const rows = await db
    .select({
      status: invoices.status,
      grandTotalMinor: invoices.grandTotalMinor,
      amountPaidMinor: invoices.amountPaidMinor,
      dueDate: invoices.dueDate,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        gte(invoices.issueDate, from),
        lte(invoices.issueDate, to),
        ne(invoices.status, "void"),
      ),
    );

  let totalInvoicedMinor = 0;
  let markedPaidMinor = 0;
  let outstandingMinor = 0;
  let overdueMinor = 0;
  let draftsCount = 0;

  for (const row of rows) {
    if (row.status === "draft") {
      draftsCount += 1;
      continue;
    }

    totalInvoicedMinor += row.grandTotalMinor;
    markedPaidMinor += row.amountPaidMinor;

    const outstanding = outstandingBalance(
      row.grandTotalMinor,
      row.amountPaidMinor,
    );

    if (outstanding > 0 && row.status !== "archived") {
      outstandingMinor += outstanding;
      const derived = deriveInvoiceStatus({
        baseStatus: row.status,
        dueDate: row.dueDate,
        amountPaidMinor: row.amountPaidMinor,
        grandTotalMinor: row.grandTotalMinor,
      });
      if (derived === "overdue") {
        overdueMinor += outstanding;
      }
    }
  }

  return {
    totalInvoicedMinor,
    markedPaidMinor,
    outstandingMinor,
    overdueMinor,
    draftsCount,
  };
}

export async function getRecentDocuments(
  workspaceId: string,
  limit = 8,
): Promise<DashboardDocument[]> {
  const invoiceRows = await db
    .select({
      id: invoices.id,
      number: invoices.invoiceNumber,
      clientName: clients.contactName,
      businessName: clients.businessName,
      grandTotalMinor: invoices.grandTotalMinor,
      currency: invoices.currency,
      status: invoices.status,
      dueDate: invoices.dueDate,
      amountPaidMinor: invoices.amountPaidMinor,
      issueDate: invoices.issueDate,
      updatedAt: invoices.updatedAt,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(eq(invoices.workspaceId, workspaceId))
    .orderBy(desc(invoices.updatedAt))
    .limit(limit);

  const quoteRows = await db
    .select({
      id: quotes.id,
      number: quotes.quoteNumber,
      clientName: clients.contactName,
      businessName: clients.businessName,
      grandTotalMinor: quotes.grandTotalMinor,
      currency: quotes.currency,
      status: quotes.status,
      validUntil: quotes.validUntil,
      issueDate: quotes.issueDate,
      updatedAt: quotes.updatedAt,
    })
    .from(quotes)
    .innerJoin(clients, eq(clients.id, quotes.clientId))
    .where(eq(quotes.workspaceId, workspaceId))
    .orderBy(desc(quotes.updatedAt))
    .limit(limit);

  type SortableDocument = DashboardDocument & { updatedAt: Date };

  const combined: SortableDocument[] = [
    ...invoiceRows.map((r) => ({
      id: r.id,
      number: r.number,
      clientName: r.businessName ?? r.clientName,
      grandTotalMinor: r.grandTotalMinor,
      currency: r.currency,
      status: deriveInvoiceStatus({
        baseStatus: r.status,
        dueDate: r.dueDate,
        amountPaidMinor: r.amountPaidMinor,
        grandTotalMinor: r.grandTotalMinor,
      }),
      date: r.issueDate,
      type: "invoice" as const,
      updatedAt: r.updatedAt,
    })),
    ...quoteRows.map((r) => ({
      id: r.id,
      number: r.number,
      clientName: r.businessName ?? r.clientName,
      grandTotalMinor: r.grandTotalMinor,
      currency: r.currency,
      status: r.status,
      date: r.issueDate,
      type: "quote" as const,
      updatedAt: r.updatedAt,
    })),
  ];

  return combined
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit)
    .map(({ updatedAt: _, ...rest }) => rest);
}

export async function getDueSoonInvoices(workspaceId: string, limit = 5) {
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      dueDate: invoices.dueDate,
      grandTotalMinor: invoices.grandTotalMinor,
      amountPaidMinor: invoices.amountPaidMinor,
      currency: invoices.currency,
      status: invoices.status,
      clientName: clients.contactName,
      businessName: clients.businessName,
    })
    .from(invoices)
    .innerJoin(clients, eq(clients.id, invoices.clientId))
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        inArray(invoices.status, ["sent", "viewed", "partially_paid"]),
      ),
    )
    .orderBy(invoices.dueDate)
    .limit(50);

  return rows
    .map((row) => ({
      ...row,
      derivedStatus: deriveInvoiceStatus({
        baseStatus: row.status,
        dueDate: row.dueDate,
        amountPaidMinor: row.amountPaidMinor,
        grandTotalMinor: row.grandTotalMinor,
      }),
      clientName: row.businessName ?? row.clientName,
    }))
    .filter((r) => r.derivedStatus === "due_soon" || r.derivedStatus === "overdue")
    .slice(0, limit);
}

export async function getMonthlyActivity(
  workspaceId: string,
  months = 6,
): Promise<MonthlyActivity[]> {
  const result = await db.execute<{ month: string; invoiced: string; paid: string }>(sql`
    SELECT
      to_char(issue_date::date, 'YYYY-MM') AS month,
      COALESCE(SUM(grand_total_minor), 0)::text AS invoiced,
      COALESCE(SUM(amount_paid_minor), 0)::text AS paid
    FROM invoices
    WHERE workspace_id = ${workspaceId}
      AND status NOT IN ('draft', 'void')
      AND issue_date >= (CURRENT_DATE - make_interval(months => ${months}))
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  return result.map((row) => ({
    month: row.month,
    invoicedMinor: Number(row.invoiced),
    paidMinor: Number(row.paid),
  }));
}
