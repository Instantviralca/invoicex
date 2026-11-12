import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, catalogueItems, clients } from "@/db/schema";
import { canUseCatalogue } from "@/lib/entitlements";
import type { PlanId } from "@/config/brand";

export async function getEditorBootstrap(workspaceId: string, planId: PlanId) {
  const clientRows = await db
    .select({
      id: clients.id,
      contactName: clients.contactName,
      businessName: clients.businessName,
      email: clients.email,
    })
    .from(clients)
    .where(and(eq(clients.workspaceId, workspaceId), isNull(clients.archivedAt)))
    .orderBy(asc(clients.contactName));

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.workspaceId, workspaceId))
    .limit(1);

  let catalogue: {
    id: string;
    name: string;
    unitPriceMinor: number;
    unit: string;
    defaultTaxRatePercent: string;
    description: string | null;
  }[] = [];

  if (canUseCatalogue(planId)) {
    catalogue = await db
      .select({
        id: catalogueItems.id,
        name: catalogueItems.name,
        unitPriceMinor: catalogueItems.unitPriceMinor,
        unit: catalogueItems.unit,
        defaultTaxRatePercent: catalogueItems.defaultTaxRatePercent,
        description: catalogueItems.description,
      })
      .from(catalogueItems)
      .where(
        and(eq(catalogueItems.workspaceId, workspaceId), isNull(catalogueItems.archivedAt)),
      )
      .orderBy(asc(catalogueItems.name));
  }

  return {
    clients: clientRows.map((c) => ({
      id: c.id,
      label: c.businessName ?? c.contactName,
      email: c.email,
    })),
    catalogue,
    defaultPaymentTermsDays: profile?.defaultPaymentTermsDays ?? 30,
    defaultTaxRatePercent: profile?.defaultTaxRatePercent ?? "0",
  };
}
