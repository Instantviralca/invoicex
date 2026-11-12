import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
  q: z.string().trim().optional(),
});

export const addressSchema = z.object({
  line1: z.string().trim().optional(),
  line2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  region: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  country: z.string().trim().optional(),
});

export const lineItemSchema = z.object({
  id: z.string().uuid().optional(),
  catalogueItemId: z.string().uuid().nullable().optional(),
  description: z.string().trim().min(1, "Description is required."),
  quantity: z.string().trim().min(1, "Quantity is required."),
  unit: z.string().trim().default("unit"),
  unitPriceMinor: z.number().int().min(0),
  discountMinor: z.number().int().min(0).default(0),
  taxRatePercent: z.string().trim().default("0"),
  position: z.number().int().min(0).optional(),
});

export type LineItemInput = z.infer<typeof lineItemSchema>;
