import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices, quotes } from "@/db/schema";
import { getWorkspaceSubscriptionStatus } from "@/lib/billing/access";
import { assertClientCapacity } from "@/lib/entitlements";
import type { ClientFormValues } from "@/lib/validations/clients";

export async function listClients(
  workspaceId: string,
  options: {
    page: number;
    pageSize: number;
    q?: string;
    sort?: string;
    order: "asc" | "desc";
    archived?: "true" | "false" | "all";
    clientType?: "business" | "individual" | "all";
  },
) {
  const conditions = [eq(clients.workspaceId, workspaceId)];

  if (options.archived === "false") {
    conditions.push(isNull(clients.archivedAt));
  } else if (options.archived === "true") {
    conditions.push(sql`${clients.archivedAt} IS NOT NULL`);
  }

  if (options.clientType && options.clientType !== "all") {
    conditions.push(eq(clients.clientType, options.clientType));
  }

  if (options.q) {
    const term = `%${options.q}%`;
    conditions.push(
      or(
        ilike(clients.contactName, term),
        ilike(clients.businessName, term),
        ilike(clients.email, term),
      )!,
    );
  }

  const where = and(...conditions);
  const sortColumn =
    options.sort === "email"
      ? clients.email
      : options.sort === "business"
        ? clients.businessName
        : clients.contactName;
  const orderFn = options.order === "asc" ? asc : desc;

  const [totalRow] = await db
    .select({ count: count() })
    .from(clients)
    .where(where);

  const rows = await db
    .select()
    .from(clients)
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);

  return {
    items: rows,
    total: totalRow?.count ?? 0,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getClientById(workspaceId: string, clientId: string) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)))
    .limit(1);

  return client ?? null;
}

export async function getClientTotals(workspaceId: string, clientId: string) {
  const [invoiceStats] = await db
    .select({
      count: count(),
      totalMinor: sql<number>`COALESCE(SUM(${invoices.grandTotalMinor}), 0)`,
      paidMinor: sql<number>`COALESCE(SUM(${invoices.amountPaidMinor}), 0)`,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.clientId, clientId),
        sql`${invoices.status} NOT IN ('draft', 'void')`,
      ),
    );

  const [quoteStats] = await db
    .select({
      count: count(),
      totalMinor: sql<number>`COALESCE(SUM(${quotes.grandTotalMinor}), 0)`,
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.workspaceId, workspaceId),
        eq(quotes.clientId, clientId),
        sql`${quotes.status} NOT IN ('draft')`,
      ),
    );

  return {
    invoiceCount: invoiceStats?.count ?? 0,
    invoiceTotalMinor: Number(invoiceStats?.totalMinor ?? 0),
    invoicePaidMinor: Number(invoiceStats?.paidMinor ?? 0),
    quoteCount: quoteStats?.count ?? 0,
    quoteTotalMinor: Number(quoteStats?.totalMinor ?? 0),
  };
}

export async function getClientHistory(workspaceId: string, clientId: string) {
  const invoiceHistory = await db
    .select({
      id: invoices.id,
      number: invoices.invoiceNumber,
      type: sql<string>`'invoice'`,
      status: invoices.status,
      grandTotalMinor: invoices.grandTotalMinor,
      issueDate: invoices.issueDate,
    })
    .from(invoices)
    .where(
      and(eq(invoices.workspaceId, workspaceId), eq(invoices.clientId, clientId)),
    )
    .orderBy(desc(invoices.issueDate))
    .limit(20);

  const quoteHistory = await db
    .select({
      id: quotes.id,
      number: quotes.quoteNumber,
      type: sql<string>`'quote'`,
      status: quotes.status,
      grandTotalMinor: quotes.grandTotalMinor,
      issueDate: quotes.issueDate,
    })
    .from(quotes)
    .where(
      and(eq(quotes.workspaceId, workspaceId), eq(quotes.clientId, clientId)),
    )
    .orderBy(desc(quotes.issueDate))
    .limit(20);

  return [...invoiceHistory, ...quoteHistory].sort(
    (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime(),
  );
}

export async function createClient(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  values: ClientFormValues,
) {
  const [activeCount] = await db
    .select({ count: count() })
    .from(clients)
    .where(and(eq(clients.workspaceId, workspaceId), isNull(clients.archivedAt)));

  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);
  assertClientCapacity(planId, activeCount?.count ?? 0, subscriptionStatus);

  const [client] = await db
    .insert(clients)
    .values({
      workspaceId,
      ...values,
      email: values.email || null,
    })
    .returning();

  return client;
}

export async function updateClient(
  workspaceId: string,
  clientId: string,
  values: ClientFormValues,
) {
  const [client] = await db
    .update(clients)
    .set({
      ...values,
      email: values.email || null,
      updatedAt: new Date(),
    })
    .where(and(eq(clients.id, clientId), eq(clients.workspaceId, workspaceId)))
    .returning();

  if (!client) throw new Error("NotFound");
  return client;
}

export function parseClientCsv(csv: string) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], rows: [], errors: ["CSV must include a header row and at least one data row."] };
  }

  const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const required = ["contact_name"];
  const missing = required.filter((r) => !headers.includes(r));
  const errors: string[] = missing.length
    ? [`Missing required columns: ${missing.join(", ")}`]
    : [];

  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return { rowNumber: index + 2, data: row };
  });

  return { headers, rows, errors };
}

export async function exportClientsCsv(workspaceId: string) {
  const rows = await db
    .select()
    .from(clients)
    .where(eq(clients.workspaceId, workspaceId))
    .orderBy(asc(clients.contactName));

  const headers = [
    "contact_name",
    "business_name",
    "client_type",
    "email",
    "telephone",
    "billing_address_line1",
    "billing_city",
    "billing_postcode",
    "billing_country",
    "vat_number",
  ];

  const escape = (v: string | null | undefined) =>
    `"${(v ?? "").replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.contactName,
        r.businessName,
        r.clientType,
        r.email,
        r.telephone,
        r.billingAddressLine1,
        r.billingCity,
        r.billingPostcode,
        r.billingCountry,
        r.vatNumber,
      ]
        .map(escape)
        .join(","),
    ),
  ];

  return lines.join("\n");
}
