import { z } from "zod";
import { paginationSchema } from "./common";

export const clientFormSchema = z.object({
  clientType: z.enum(["business", "individual"]).default("business"),
  contactName: z.string().trim().min(1, "Contact name is required."),
  businessName: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  telephone: z.string().trim().optional(),
  billingAddressLine1: z.string().trim().optional(),
  billingAddressLine2: z.string().trim().optional(),
  billingCity: z.string().trim().optional(),
  billingRegion: z.string().trim().optional(),
  billingPostcode: z.string().trim().optional(),
  billingCountry: z.string().trim().default("GB"),
  serviceAddressLine1: z.string().trim().optional(),
  serviceAddressLine2: z.string().trim().optional(),
  serviceCity: z.string().trim().optional(),
  serviceRegion: z.string().trim().optional(),
  servicePostcode: z.string().trim().optional(),
  serviceCountry: z.string().trim().optional(),
  companyNumber: z.string().trim().optional(),
  vatNumber: z.string().trim().optional(),
  defaultCurrency: z.string().length(3).default("GBP"),
  defaultPaymentTermsDays: z.number().int().min(0).max(365).nullable().optional(),
  internalNotes: z.string().trim().optional(),
});

export const clientListQuerySchema = paginationSchema.extend({
  archived: z.enum(["true", "false", "all"]).default("false"),
  clientType: z.enum(["business", "individual", "all"]).default("all"),
});

export const clientImportPreviewSchema = z.object({
  csv: z.string().min(1, "CSV content is required."),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
