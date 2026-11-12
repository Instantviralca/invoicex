import Link from "next/link";
import { Package, Plus } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { UpgradePrompt } from "@/components/app/upgrade-prompt";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAppContext } from "@/lib/app-context";
import { membershipSubscriptionStatus } from "@/lib/billing/access";
import { canUseCatalogue } from "@/lib/entitlements";
import { listCatalogueItems } from "@/lib/services/catalogue";
import { formatMoney } from "@/lib/money";

export default async function ProductsPage() {
  const { membership } = await requireAppContext();
  const hasCatalogue = canUseCatalogue(
    membership.workspace.planId,
    membershipSubscriptionStatus(membership),
  );

  if (!hasCatalogue) {
    return (
      <div>
        <PageHeader
          title="Products & Services"
          description="Save reusable line items for faster invoicing."
        />
        <UpgradePrompt
          title="Catalogue available on Pro"
          description="Upgrade to save products and services and add them to invoices in one click."
          feature="Saved products and services"
        />
      </div>
    );
  }

  const result = await listCatalogueItems(membership.workspaceId, {
    page: 1,
    pageSize: 100,
    order: "asc",
    archived: "false",
    type: "all",
  });

  return (
    <div>
      <PageHeader
        title="Products & Services"
        description="Manage your catalogue of billable products and services."
        actions={
          <Button asChild>
            <Link href="/app/products/new">
              <Plus className="size-4" />
              Add item
            </Link>
          </Button>
        }
      />

      {result.items.length === 0 ? (
        <EmptyState
          icon={<Package className="size-5" />}
          title="Catalogue is empty"
          description="Add products or services you invoice frequently."
          action={
            <Button asChild>
              <Link href="/app/products/new">Add item</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Unit price</TableHead>
              <TableHead>VAT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link
                    href={`/app/products/${item.id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {item.name}
                  </Link>
                  {item.description ? (
                    <p className="text-xs text-foreground-muted">{item.description}</p>
                  ) : null}
                </TableCell>
                <TableCell className="capitalize">{item.type}</TableCell>
                <TableCell className="font-tabular">
                  {formatMoney(item.unitPriceMinor, item.currency)}
                </TableCell>
                <TableCell className="font-tabular">{item.defaultTaxRatePercent}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
