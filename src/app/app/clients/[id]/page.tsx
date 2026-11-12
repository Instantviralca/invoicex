import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { ClientForm } from "@/components/app/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppContext } from "@/lib/app-context";
import {
  getClientById,
  getClientHistory,
  getClientTotals,
} from "@/lib/services/clients";
import { formatMoney } from "@/lib/money";

type PageProps = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { membership } = await requireAppContext();

  const client = await getClientById(membership.workspaceId, id);
  if (!client) notFound();

  const [totals, history] = await Promise.all([
    getClientTotals(membership.workspaceId, id),
    getClientHistory(membership.workspaceId, id),
  ]);

  return (
    <div>
      <PageHeader
        title={client.businessName ?? client.contactName}
        description="Client details, totals, and document history."
        actions={
          <Link href="/app/clients" className="text-sm text-brand hover:underline">
            Back to clients
          </Link>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Invoices", value: String(totals.invoiceCount) },
          {
            label: "Invoiced",
            value: formatMoney(totals.invoiceTotalMinor, client.defaultCurrency ?? "GBP"),
          },
          {
            label: "Paid",
            value: formatMoney(totals.invoicePaidMinor, client.defaultCurrency ?? "GBP"),
          },
          { label: "Quotes", value: String(totals.quoteCount) },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground-muted">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Document history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-foreground-muted">No invoices or quotes yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-background">
            {history.map((doc) => (
              <li key={`${doc.type}-${doc.id}`} className="flex justify-between px-4 py-3">
                <div>
                  <Link
                    href={`/app/${doc.type}s/${doc.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {doc.number}
                  </Link>
                  <p className="text-xs capitalize text-foreground-muted">{doc.type}</p>
                </div>
                <div className="text-right text-sm">
                  <p>{formatMoney(doc.grandTotalMinor)}</p>
                  <p className="text-foreground-muted">{doc.issueDate}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Edit client</h2>
        <ClientForm
          clientId={client.id}
          initial={{
            clientType: client.clientType,
            contactName: client.contactName,
            businessName: client.businessName ?? "",
            email: client.email ?? "",
            telephone: client.telephone ?? "",
            billingAddressLine1: client.billingAddressLine1 ?? "",
            billingAddressLine2: client.billingAddressLine2 ?? "",
            billingCity: client.billingCity ?? "",
            billingRegion: client.billingRegion ?? "",
            billingPostcode: client.billingPostcode ?? "",
            billingCountry: client.billingCountry ?? "GB",
            vatNumber: client.vatNumber ?? "",
            companyNumber: client.companyNumber ?? "",
            defaultCurrency: client.defaultCurrency ?? "GBP",
            internalNotes: client.internalNotes ?? "",
          }}
        />
      </section>
    </div>
  );
}
