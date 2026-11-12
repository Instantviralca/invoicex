import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { AccountDeletionConfirmationEmail } from "@/emails/account-deletion-confirmation";
import { ContactConfirmationEmail } from "@/emails/contact-confirmation";
import { ContactInternalNotificationEmail } from "@/emails/contact-internal-notification";
import { InvoiceSentEmail } from "@/emails/invoice-sent";
import { PaymentFailedEmail } from "@/emails/payment-failed";
import { PaymentReminderEmail } from "@/emails/payment-reminder";
import { QuoteAcceptedEmail } from "@/emails/quote-accepted";
import { QuoteRejectedEmail } from "@/emails/quote-rejected";
import { QuoteSentEmail } from "@/emails/quote-sent";
import { ResetPasswordEmail } from "@/emails/reset-password";
import { SubscriptionActivatedEmail } from "@/emails/subscription-activated";
import { SubscriptionCancelledEmail } from "@/emails/subscription-cancelled";
import { SubscriptionChangedEmail } from "@/emails/subscription-changed";
import { TeamInviteEmail } from "@/emails/team-invite";
import { UpcomingRecurringEmail } from "@/emails/upcoming-recurring";
import { VerifyEmailEmail } from "@/emails/verify-email";

export type EmailTemplateName =
  | "verify-email"
  | "reset-password"
  | "password-reset"
  | "invoice-sent"
  | "quote-sent"
  | "quote-accepted"
  | "quote-rejected"
  | "payment-reminder"
  | "upcoming-recurring"
  | "subscription-activated"
  | "subscription-changed"
  | "payment-failed"
  | "subscription-cancelled"
  | "account-deletion-confirmation"
  | "contact-confirmation"
  | "contact-internal-notification"
  | "team-invite";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TemplatePropsMap = Record<EmailTemplateName, any>;

const templateRenderers: Record<
  EmailTemplateName,
  (props: TemplatePropsMap[EmailTemplateName]) => ReactElement
> = {
  "verify-email": (props) => VerifyEmailEmail(props),
  "reset-password": (props) => ResetPasswordEmail(props),
  "password-reset": (props) => ResetPasswordEmail(props),
  "invoice-sent": (props) => InvoiceSentEmail(props),
  "quote-sent": (props) => QuoteSentEmail(props),
  "quote-accepted": (props) => QuoteAcceptedEmail(props),
  "quote-rejected": (props) => QuoteRejectedEmail(props),
  "payment-reminder": (props) => PaymentReminderEmail(props),
  "upcoming-recurring": (props) => UpcomingRecurringEmail(props),
  "subscription-activated": (props) => SubscriptionActivatedEmail(props),
  "subscription-changed": (props) => SubscriptionChangedEmail(props),
  "payment-failed": (props) => PaymentFailedEmail(props),
  "subscription-cancelled": (props) => SubscriptionCancelledEmail(props),
  "account-deletion-confirmation": (props) =>
    AccountDeletionConfirmationEmail(props),
  "contact-confirmation": (props) => ContactConfirmationEmail(props),
  "contact-internal-notification": (props) =>
    ContactInternalNotificationEmail(props),
  "team-invite": (props) => TeamInviteEmail(props),
};

export async function renderEmailTemplate<T extends EmailTemplateName>(
  template: T,
  props: TemplatePropsMap[T],
): Promise<{ html: string; text: string }> {
  const element = templateRenderers[template](props);
  const html = await render(element);
  const text = await render(element, { plainText: true });
  return { html, text };
}
