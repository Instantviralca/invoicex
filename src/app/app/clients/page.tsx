import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/app-context";
import { listClients } from "@/lib/services/clients";
import { ClientImportExport } from "@/components/app/client-import-export";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    sort?: string;
    order?: "asc" | "desc";
  }>;
};

export default async function ClientsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { membership } = await requireAppContext();

  const result = await listClients(membership.workspaceId, {
    page: Number(params.page ?? 1),
    pageSize: 20,
    q: params.q,
    sort: params.sort,
    order: params.order ?? "asc",
    archived: "false",
    clientType: "all",
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        description="Manage your client directory, billing details, and document history."
        actions={
          <div className="flex gap-2">
            <ClientImportExport />
            <Button asChild>
              <Link href="/app/clients/new">
                <Plus className="size-4" />
                Add client
              </Link>
            </Button>
          </div>
        }
      />

      <form
        className="surface-card mb-6 flex flex-wrap items-center gap-2 p-3"
        action="/app/clients"
        method="get"
      >
        <Input
          name="q"
          placeholder="Search clients…"
          defaultValue={params.q ?? ""}
          className="max-w-sm border-border-soft bg-background"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={params.q ? "No clients found" : "No clients yet"}
          description={
            params.q
              ? "Try a different search term or add a new client."
              : "Add your first client or import a CSV to get started."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {params.q ? (
                <Button asChild variant="outline">
                  <Link href="/app/clients">Clear search</Link>
                </Button>
              ) : null}
              <Button asChild>
                <Link href="/app/clients/new">Add client</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link
                      href={`/app/clients/${client.id}`}
                      className="font-medium text-brand hover:underline"
                    >
                      {client.businessName ?? client.contactName}
                    </Link>
                    {client.businessName ? (
                      <p className="text-xs text-foreground-muted">{client.contactName}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-foreground-muted">
                    {client.email ?? "—"}
                  </TableCell>
                  <TableCell className="capitalize">{client.clientType}</TableCell>
                  <TableCell className="text-foreground-muted">
                    {[client.billingCity, client.billingPostcode].filter(Boolean).join(", ") ||
                      "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-sm text-foreground-muted">
            Showing {result.items.length} of {result.total} clients
          </p>
        </>
      )}
    </div>
  );
}
