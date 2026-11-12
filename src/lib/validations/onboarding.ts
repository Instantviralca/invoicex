import { z } from "zod";

export const onboardingStepSchema = z.object({
  step: z.number().int().min(1).max(5),
  skip: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const onboardingBusinessSchema = z.object({
  tradingName: z.string().trim().min(1, "Trading name is required."),
  legalName: z.string().trim().optional(),
  businessType: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  telephone: z.string().trim().optional(),
  website: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  region: z.string().trim().optional(),
  postcode: z.string().trim().optional(),
  country: z.string().trim().default("GB"),
});

export const onboardingInvoiceSettingsSchema = z.object({
  invoicePrefix: z.string().trim().min(1).default("INV-"),
  quotePrefix: z.string().trim().min(1).default("QUO-"),
  defaultPaymentTermsDays: z.number().int().min(0).max(365).default(30),
  defaultInvoiceNotes: z.string().trim().optional(),
  defaultPaymentInstructions: z.string().trim().optional(),
});

export const onboardingTaxSchema = z.object({
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().trim().optional(),
  defaultTaxRatePercent: z.string().trim().default("0"),
  pricesInclusiveOfTax: z.boolean().default(false),
});

export const onboardingBrandingSchema = z.object({
  accentColour: z.string().trim().default("#1D4ED8"),
  documentTemplate: z.enum(["classic", "modern", "minimal"]).default("classic"),
});
