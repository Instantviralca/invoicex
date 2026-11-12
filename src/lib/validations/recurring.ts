import { z } from "zod";
import { lineItemSchema, paginationSchema } from "./common";

export const recurringFormSchema = z
  .object({
    clientId: z.string().uuid("Select a client."),
    frequency: z.enum([
      "weekly",
      "monthly",
      "quarterly",
      "semiannual",
      "annually",
      "custom",
    ]),
    customIntervalDays: z.number().int().min(1).max(365).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    nextRunDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    autoSend: z.boolean().default(false),
    active: z.boolean().default(true),
    currency: z.string().length(3).default("GBP"),
    notes: z.string().trim().optional(),
    terms: z.string().trim().optional(),
    paymentInstructions: z.string().trim().optional(),
    lineItems: z.array(lineItemSchema).min(1, "Add at least one line item."),
  })
  .refine(
    (value) => value.frequency !== "custom" || Boolean(value.customIntervalDays),
    {
      message: "Enter the number of days for a custom interval.",
      path: ["customIntervalDays"],
    },
  );

export const recurringListQuerySchema = paginationSchema;

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;
