import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles } from "@/db/schema";
import { sanitizeUserText } from "@/lib/email/sanitize";
import { sendEmail } from "@/lib/email/send";
import { formatMoney } from "@/lib/money";
import {
  buildInvoicePdfInput,
  buildQuotePdfInput,
} from "@/lib/pdf/build-document-pdf-input";
import { generateDocumentPdf } from "@/lib/pdf/generate-document-pdf";
import { incrementEmailUsage } from "@/lib/services/usage";
import { getInvoiceWithLines } from "@/lib/services/invoices";
import { getQuoteWithLines } from "@/lib/services/quotes";
import { absoluteUrl } from "@/lib/utils";

const EMAIL_BATCH_FAIR_USE_LIMIT = 1000;

export async function assertEmailSendingAllowed(
  workspaceId: string,
  planId: "free" | "starter" | "pro" | "business",
): Promise<void> {
  const { getUsageForPeriod } = await import("@/lib/services/usage");
  const usage = await getUsageForPeriod(workspaceId);

  if (planId === "starter" && usage.emailsSent >= 200) {
    throw new Error(
      "You have reached the monthly email limit on your Starter plan.",
    );
  }

  if (usage.emailsSent >= EMAIL_BATCH_FAIR_USE_LIMIT) {
    throw new Error("Monthly email fair-use limit reached.");
  }
}

export async function sendInvoiceEmail(input: {
  workspaceId: string;
  planId: "free" | "starter" | "pro" | "business";
  invoiceId: string;
  userId: string;
  toEmail?: string;
  subject?: string;
  message?: string;
}) {
  await assertEmailSendingAllowed(input.workspaceId, input.planId);

  const data = await getInvoiceWithLines(input.workspaceId, input.invoiceId);
  if (!data) throw new Error("NotFound");

  const recipient = input.toEmail?.trim().toLowerCase() ?? data.client?.email;
  if (!recipient) {
    throw new Error("No recipient email address is available for this client.");
  }

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, data.invoice.businessProfileId))
    .limit(1);

  const pdfData = await buildInvoicePdfInput(
    input.workspaceId,
    input.planId,
    input.invoiceId,
  );
  if (!pdfData) throw new Error("NotFound");

  const pdfBuffer = await generateDocumentPdf(pdfData.input);
  const businessName = profile?.tradingName ?? "Your supplier";
  const clientName =
    data.client?.businessName ?? data.client?.contactName ?? "there";
  const customMessage = input.message
    ? sanitizeUserText(input.message)
    : undefined;

  const defaultSubject = `Invoice ${data.invoice.invoiceNumber} from ${businessName}`;
  const subject = sanitizeUserText(input.subject ?? defaultSubject, 200);

  const result = await sendEmail({
    to: recipient,
    subject,
    template: "invoice-sent",
    templateProps: {
      businessName,
      invoiceNumber: data.invoice.invoiceNumber,
      clientName,
      amountFormatted: formatMoney(
        data.invoice.grandTotalMinor,
        data.invoice.currency,
      ),
      dueDate: data.invoice.dueDate,
      customMessage,
    },
    workspaceId: input.workspaceId,
    userId: input.userId,
    relatedType: "invoice",
    relatedId: input.invoiceId,
    attachments: [
      {
        filename: pdfData.filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  if (result.success && result.status === "sent") {
    await incrementEmailUsage(input.workspaceId);
  }

  return { ...result, to: recipient };
}

export async function sendQuoteEmail(input: {
  workspaceId: string;
  planId: "free" | "starter" | "pro" | "business";
  quoteId: string;
  userId: string;
  toEmail?: string;
  subject?: string;
  message?: string;
  publicUrl?: string;
}) {
  await assertEmailSendingAllowed(input.workspaceId, input.planId);

  const data = await getQuoteWithLines(input.workspaceId, input.quoteId);
  if (!data) throw new Error("NotFound");

  const recipient = input.toEmail?.trim().toLowerCase() ?? data.client?.email;
  if (!recipient) {
    throw new Error("No recipient email address is available for this client.");
  }

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, data.quote.businessProfileId))
    .limit(1);

  const pdfData = await buildQuotePdfInput(
    input.workspaceId,
    input.planId,
    input.quoteId,
  );
  if (!pdfData) throw new Error("NotFound");

  const pdfBuffer = await generateDocumentPdf(pdfData.input);
  const businessName = profile?.tradingName ?? "Your supplier";
  const clientName =
    data.client?.businessName ?? data.client?.contactName ?? "there";
  const customMessage = input.message
    ? sanitizeUserText(input.message)
    : undefined;

  const defaultSubject = `Quote ${data.quote.quoteNumber} from ${businessName}`;
  const subject = sanitizeUserText(input.subject ?? defaultSubject, 200);

  const result = await sendEmail({
    to: recipient,
    subject,
    template: "quote-sent",
    templateProps: {
      businessName,
      quoteNumber: data.quote.quoteNumber,
      clientName,
      amountFormatted: formatMoney(
        data.quote.grandTotalMinor,
        data.quote.currency,
      ),
      validUntil: data.quote.validUntil,
      customMessage,
      publicUrl: input.publicUrl,
    },
    workspaceId: input.workspaceId,
    userId: input.userId,
    relatedType: "quote",
    relatedId: input.quoteId,
    attachments: [
      {
        filename: pdfData.filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });

  if (result.success && result.status === "sent") {
    await incrementEmailUsage(input.workspaceId);
  }

  return { ...result, to: recipient };
}

export async function sendPaymentReminderEmail(input: {
  workspaceId: string;
  planId: "free" | "starter" | "pro" | "business";
  invoiceId: string;
  daysOverdue?: number;
}) {
  await assertEmailSendingAllowed(input.workspaceId, input.planId);

  const data = await getInvoiceWithLines(input.workspaceId, input.invoiceId);
  if (!data) throw new Error("NotFound");

  const recipient = data.client?.email;
  if (!recipient) return { skipped: true as const, reason: "no_email" as const };

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.id, data.invoice.businessProfileId))
    .limit(1);

  const businessName = profile?.tradingName ?? "Your supplier";
  const clientName =
    data.client?.businessName ?? data.client?.contactName ?? "there";

  const pdfData = await buildInvoicePdfInput(
    input.workspaceId,
    input.planId,
    input.invoiceId,
  );
  const attachments = pdfData
    ? [
        {
          filename: pdfData.filename,
          content: await generateDocumentPdf(pdfData.input),
          contentType: "application/pdf",
        },
      ]
    : undefined;

  const result = await sendEmail({
    to: recipient,
    subject: `Payment reminder: invoice ${data.invoice.invoiceNumber}`,
    template: "payment-reminder",
    templateProps: {
      businessName,
      invoiceNumber: data.invoice.invoiceNumber,
      clientName,
      amountFormatted: formatMoney(
        data.invoice.grandTotalMinor,
        data.invoice.currency,
      ),
      dueDate: data.invoice.dueDate,
      daysOverdue: input.daysOverdue,
    },
    workspaceId: input.workspaceId,
    relatedType: "invoice",
    relatedId: input.invoiceId,
    attachments,
  });

  if (result.success && result.status === "sent") {
    await incrementEmailUsage(input.workspaceId);
  }

  return result;
}

export function billingPortalUrl(): string {
  return absoluteUrl("/app/subscription");
}
