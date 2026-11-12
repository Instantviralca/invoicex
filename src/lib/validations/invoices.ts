import { z } from "zod";
import { lineItemSchema, paginationSchema } from "./common";

export const invoiceFormSchema = z.object({
  clientId: z.string().uuid("Select a client."),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().length(3).default("GBP"),
  customerReference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  paymentInstructions: z.string().trim().optional(),
  terms: z.string().trim().optional(),
  footerNote: z.string().trim().optional(),
  template: z.enum(["classic", "modern", "minimal"]).default("classic"),
  accentColour: z.string().trim().optional(),
  pricesInclusiveOfTax: z.boolean().default(false),
  shippingMinor: z.number().int().min(0).default(0),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one line item."),
});

export const invoiceListQuerySchema = paginationSchema.extend({
  status: z.string().optional(),
});

export const invoiceActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("send") }),
  z.object({ action: z.literal("mark_paid") }),
  z.object({ action: z.literal("mark_partial") }),
  z.object({
    action: z.literal("add_payment"),
    amountMinor: z.number().int().positive(),
    label: z.string().trim().min(1, "Enter a payment label."),
    paidAt: z.string().datetime().optional(),
    method: z.string().trim().optional(),
    reference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  }),
  z.object({ action: z.literal("void") }),
  z.object({ action: z.literal("archive") }),
  z.object({ action: z.literal("restore") }),
  z.object({ action: z.literal("delete") }),
  z.object({ action: z.literal("duplicate") }),
  z.object({
    action: z.literal("email"),
    toEmail: z.string().email().optional(),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().max(5000).optional(),
  }),
]);

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
