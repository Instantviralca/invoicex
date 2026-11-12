import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { brand } from "@/config/brand";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import { sanitizeUserText } from "@/lib/email/sanitize";
import {
  renderEmailTemplate,
  type EmailTemplateName,
} from "@/lib/email/render";
import { logger } from "@/lib/logger";

export type EmailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  template: EmailTemplateName | string;
  templateProps?: Record<string, unknown>;
  /** Legacy fallback — prefer templateProps with React Email templates. */
  html?: string;
  text?: string;
  workspaceId?: string;
  userId?: string;
  relatedType?: string;
  relatedId?: string;
  attachments?: EmailAttachment[];
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  emailLogId?: string;
  status: "queued" | "sent" | "failed";
};

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith("re_replace")) return null;
  return new Resend(apiKey);
}

function isDevelopmentWithoutProvider(): boolean {
  return process.env.NODE_ENV === "development" && !getResendClient();
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const to = input.to.trim().toLowerCase();
  const subject = sanitizeUserText(input.subject, 200);

  let html = input.html;
  let text = input.text;

  if (input.templateProps && isKnownTemplate(input.template)) {
    const rendered = await renderEmailTemplate(
      input.template,
      input.templateProps as never,
    );
    html = rendered.html;
    text = rendered.text;
  }

  if (!html) {
    throw new Error("Email content could not be rendered.");
  }

  const [logEntry] = await db
    .insert(emailLogs)
    .values({
      workspaceId: input.workspaceId ?? null,
      userId: input.userId ?? null,
      toEmail: to,
      subject,
      template: input.template,
      status: "queued",
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
    })
    .returning({ id: emailLogs.id });

  const emailLogId = logEntry?.id;

  if (isDevelopmentWithoutProvider()) {
    logger.info(
      {
        emailLogId,
        template: input.template,
        to,
        subject,
        devMode: true,
      },
      "Email logged in development (provider not configured)",
    );

    await db
      .update(emailLogs)
      .set({
        status: "sent",
        updatedAt: new Date(),
      })
      .where(eq(emailLogs.id, emailLogId!));

    return {
      success: true,
      emailLogId,
      status: "sent",
    };
  }

  const resend = getResendClient();
  if (!resend) {
    logger.warn(
      { emailLogId, template: input.template },
      "RESEND_API_KEY not configured; email remains queued",
    );
    return { success: true, emailLogId, status: "queued" };
  }

  try {
    const attachments = input.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.contentType ?? "application/octet-stream",
    }));

    const result = await resend.emails.send({
      from: brand.fromEmail,
      to,
      subject,
      html,
      text: text ?? undefined,
      attachments,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    await db
      .update(emailLogs)
      .set({
        status: "sent",
        providerMessageId: result.data?.id ?? null,
        updatedAt: new Date(),
      })
      .where(eq(emailLogs.id, emailLogId!));

    logger.info(
      {
        emailLogId,
        providerMessageId: result.data?.id,
        template: input.template,
        to,
      },
      "Email handed off to provider",
    );

    return {
      success: true,
      emailLogId,
      messageId: result.data?.id,
      status: "sent",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown email delivery error";

    await db
      .update(emailLogs)
      .set({
        status: "failed",
        errorMessage: message,
        updatedAt: new Date(),
      })
      .where(eq(emailLogs.id, emailLogId!));

    logger.error({ err: error, emailLogId, template: input.template }, "Email send failed");

    return {
      success: false,
      emailLogId,
      status: "failed",
    };
  }
}

function isKnownTemplate(template: string): template is EmailTemplateName {
  return [
    "verify-email",
    "reset-password",
    "password-reset",
    "invoice-sent",
    "quote-sent",
    "quote-accepted",
    "quote-rejected",
    "payment-reminder",
    "upcoming-recurring",
    "subscription-activated",
    "subscription-changed",
    "payment-failed",
    "subscription-cancelled",
    "account-deletion-confirmation",
    "contact-confirmation",
    "contact-internal-notification",
    "team-invite",
  ].includes(template);
}
