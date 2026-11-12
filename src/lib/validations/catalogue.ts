import { z } from "zod";
import { paginationSchema } from "./common";

export const catalogueItemSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  description: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  type: z.enum(["product", "service"]).default("service"),
  unit: z.string().trim().default("unit"),
  unitPriceMinor: z.number().int().min(0),
  defaultTaxRatePercent: z.string().trim().default("0"),
  currency: z.string().length(3).default("GBP"),
});

export const catalogueListQuerySchema = paginationSchema.extend({
  type: z.enum(["product", "service", "all"]).default("all"),
  archived: z.enum(["true", "false"]).default("false"),
});

export type CatalogueItemValues = z.infer<typeof catalogueItemSchema>;
