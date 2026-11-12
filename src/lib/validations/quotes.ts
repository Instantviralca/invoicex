import { z } from "zod";
import { lineItemSchema, paginationSchema } from "./common";

export const quoteFormSchema = z.object({
  clientId: z.string().uuid("Select a client."),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  validUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().length(3).default("GBP"),
  customerReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  terms: z.string().trim().optional(),
  footerNote: z.string().trim().optional(),
  template: z.enum(["classic", "modern", "minimal"]).default("classic"),
  accentColour: z.string().trim().optional(),
  pricesInclusiveOfTax: z.boolean().default(false),
  shippingMinor: z.number().int().min(0).default(0),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item."),
});

export const quoteListQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
});

export const quoteActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("restore") }),
  z.object({ action: z.literal("delete") }),
  z.object({ action: z.literal("duplicate") }),
  z.object({ action: z.literal("convert") }),
  z.object({ action: z.literal("generate_public_link") }),
  z.object({
    action: z.literal("email"),
    toEmail: z.string().email().optional(),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().max(5000).optional(),
  }),
]);

export const quoteResponseSchema = z.object({
  action: z.enum(["accept", "reject"]),
  respondentName: z.string().trim().min(1, "Please enter your name."),
  comment: z.string().trim().optional(),
});

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;
