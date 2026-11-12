import { and, asc, count, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { catalogueItems } from "@/db/schema";
import { getWorkspaceSubscriptionStatus } from "@/lib/billing/access";
import { canUseCatalogue } from "@/lib/entitlements";
import type { CatalogueItemValues } from "@/lib/validations/catalogue";

export async function assertCatalogueAccess(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
) {
  const subscriptionStatus = await getWorkspaceSubscriptionStatus(workspaceId);
  if (!canUseCatalogue(planId, subscriptionStatus)) {
    throw new Error("Catalogue requires a Pro plan or higher.");
  }
}

export async function listCatalogueItems(
  workspaceId: string,
  options: {
    page: number;
    pageSize: number;
    q?: string;
    sort?: string;
    order: "asc" | "desc";
    type?: "product" | "service" | "all";
    archived?: "true" | "false";
  },
) {
  const conditions = [eq(catalogueItems.workspaceId, workspaceId)];

  if (options.archived === "false") {
    conditions.push(isNull(catalogueItems.archivedAt));
  } else {
    conditions.push(sql`${catalogueItems.archivedAt} IS NOT NULL`);
  }

  if (options.type && options.type !== "all") {
    conditions.push(eq(catalogueItems.type, options.type));
  }

  if (options.q) {
    const term = `%${options.q}%`;
    conditions.push(
      or(
        ilike(catalogueItems.name, term),
        ilike(catalogueItems.sku, term),
        ilike(catalogueItems.description, term),
      )!,
    );
  }

  const where = and(...conditions);
  const sortColumn =
    options.sort === "price"
      ? catalogueItems.unitPriceMinor
      : options.sort === "type"
        ? catalogueItems.type
        : catalogueItems.name;
  const orderFn = options.order === "asc" ? asc : desc;

  const [totalRow] = await db
    .select({ count: count() })
    .from(catalogueItems)
    .where(where);

  const items = await db
    .select()
    .from(catalogueItems)
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(options.pageSize)
    .offset((options.page - 1) * options.pageSize);

  return {
    items,
    total: totalRow?.count ?? 0,
    page: options.page,
    pageSize: options.pageSize,
  };
}

export async function getCatalogueItem(workspaceId: string, id: string) {
  const [item] = await db
    .select()
    .from(catalogueItems)
    .where(and(eq(catalogueItems.id, id), eq(catalogueItems.workspaceId, workspaceId)))
    .limit(1);
  return item ?? null;
}

export async function createCatalogueItem(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  values: CatalogueItemValues,
) {
  await assertCatalogueAccess(workspaceId, planId);
  const [item] = await db
    .insert(catalogueItems)
    .values({ workspaceId, ...values })
    .returning();
  return item;
}

export async function updateCatalogueItem(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
  id: string,
  values: CatalogueItemValues,
) {
  await assertCatalogueAccess(workspaceId, planId);
  const [item] = await db
    .update(catalogueItems)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(catalogueItems.id, id), eq(catalogueItems.workspaceId, workspaceId)))
    .returning();
  if (!item) throw new Error("NotFound");
  return item;
}

export async function archiveCatalogueItem(workspaceId: string, id: string) {
  const [item] = await db
    .update(catalogueItems)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(catalogueItems.id, id), eq(catalogueItems.workspaceId, workspaceId)))
    .returning();
  if (!item) throw new Error("NotFound");
  return item;
}
