import Link from "next/link";
import { brand } from "@/config/brand";

export type HelpArticleMeta = {
  slug: string;
  title: string;
  description: string;
  category: string;
};

export const helpArticleMeta: HelpArticleMeta[] = [
  {
    slug: "creating-first-invoice",
    title: "Creating your first invoice",
    description:
      "Step-by-step guidance for setting up your business profile and sending your first invoice.",
    category: "Getting started",
  },
  {
    slug: "quotes-conversion",
    title: "Converting a quote to an invoice",
    description:
      "How to turn an accepted quote into an invoice without re-entering line items.",
    category: "Documents",
  },
  {
    slug: "vat",
    title: "Adding VAT to documents",
    description:
      "How VAT fields work in InvoiceX and what you need to check for your business.",
    category: "Tax and compliance",
  },
  {
    slug: "business-details",
    title: "Managing your business details",
    description:
      "Update your trading name, address, bank details, and logo for documents.",
    category: "Account setup",
  },
  {
    slug: "sending-documents",
    title: "Sending invoices and quotes by email",
    description:
      "Email documents from InvoiceX on paid plans, and alternatives on the Free plan.",
    category: "Documents",
  },
  {
    slug: "recording-payment",
    title: "Recording a payment",
    description:
      "Mark invoices as paid and keep your outstanding balance accurate.",
    category: "Documents",
  },
  {
    slug: "recurring-invoices",
    title: "Setting up recurring invoices",
    description: "Automate repeat billing on Pro and Business plans.",
    category: "Advanced",
  },
  {
    slug: "changing-subscription",
    title: "Changing your subscription plan",
    description:
      "Upgrade, downgrade, or switch between monthly and annual billing.",
    category: "Billing",
  },
  {
    slug: "cancelling",
    title: "Cancelling your subscription",
    description:
      "How to cancel online and what happens to your account and documents.",
    category: "Billing",
  },
  {
    slug: "exporting",
    title: "Exporting your data",
    description: "Download CSV exports and PDF copies of your documents.",
    category: "Data",
  },
  {
    slug: "closing-account",
    title: "Closing your account",
    description: "How to request account closure and what data is retained.",
    category: "Account",
  },
];

export function getHelpArticleMeta(slug: string): HelpArticleMeta | undefined {
  return helpArticleMeta.find((article) => article.slug === slug);
}

export const helpArticleSlugs = helpArticleMeta.map((a) => a.slug);

export const helpArticleContent: Record<string, React.ReactNode> = {
  "creating-first-invoice": (
    <>
      <p>
        Before creating your first invoice, complete your business profile in
        Settings. Add your trading name, registered or trading address, contact
        email, and optional VAT registration number. These details appear on
        every document you generate.
      </p>
      <ol>
        <li>Go to Clients and add the client you are billing.</li>
        <li>Select Invoices, then New invoice.</li>
        <li>Choose a template (Classic on the Free plan; all templates on paid plans).</li>
        <li>Add line items with descriptions, quantities, and unit prices.</li>
        <li>Set the issue date and payment due date.</li>
        <li>Review totals and VAT, then save the invoice.</li>
        <li>Download the PDF. On Starter and above, you can email the document from {brand.productName}.</li>
      </ol>
      <p>
        The Free plan includes three combined invoices and quotes per month. If
        you reach the limit, you can upgrade from the Subscription page or wait
        until the next billing period.
      </p>
    </>
  ),
  "quotes-conversion": (
    <>
      <p>
        Quotes help you agree scope and pricing before you invoice. When a client
        accepts a quote, you can convert it to an invoice without retyping line
        items.
      </p>
      <ol>
        <li>Open the quote from your Quotes list.</li>
        <li>Confirm the status reflects acceptance (you can mark it as accepted manually).</li>
        <li>Select Convert to invoice.</li>
        <li>Review the pre-filled invoice details, adjust dates if needed, and save.</li>
      </ol>
      <p>
        The new invoice receives its own document number. The original quote
        remains in your records for reference.
      </p>
    </>
  ),
  vat: (
    <>
      <p>
        {brand.productName} lets you add VAT to line items and display VAT
        totals on invoices and quotes. You enter your VAT registration number
        in your business profile when applicable.
      </p>
      <p>
        You are responsible for determining whether VAT applies to your supplies,
        which rate to use, and how to record VAT in your own accounting.{" "}
        {brand.productName} does not provide tax or accounting advice.
      </p>
      <p>
        If you are unsure about VAT registration or treatment, speak to a
        qualified accountant or tax adviser before issuing documents to clients.
      </p>
    </>
  ),
  "business-details": (
    <>
      <p>
        Your business profile controls the header information on invoices and
        quotes, including your trading name, address, email, telephone number,
        bank details, and optional logo.
      </p>
      <p>
        On the Business plan, you can maintain up to three business profiles
        within a workspace, which is useful if you trade under more than one
        name.
      </p>
      <p>
        Keep bank details accurate so clients can pay you promptly. Changes apply
        to new documents; existing saved documents retain the details they were
        created with unless you edit them.
      </p>
    </>
  ),
  "sending-documents": (
    <>
      <p>
        All plans support PDF downloads. You can save the PDF and send it using
        your own email client on the Free plan.
      </p>
      <p>
        On Starter, Pro, and Business plans, you can email invoices and quotes
        directly from {brand.productName}. The message includes a link or
        attachment according to your settings, with your business details on
        the document.
      </p>
      <p>
        Check the recipient email address before sending. You remain responsible
        for the content of documents you issue to clients.
      </p>
    </>
  ),
  "recording-payment": (
    <>
      <p>
        When a client pays, open the invoice and update its payment status to
        Paid. You can optionally record the payment date and method for your
        records.
      </p>
      <p>
        Payment-status tracking helps you see what is outstanding at a glance.
        {brand.productName} does not process client payments — it records status
        only. Your clients pay you via the bank details or payment instructions
        shown on the invoice.
      </p>
    </>
  ),
  "recurring-invoices": (
    <>
      <p>
        Recurring invoices are available on Pro and Business plans. They suit
        retainers, subscriptions, and other repeat billing where the amount and
        schedule are predictable.
      </p>
      <ol>
        <li>Create or open an invoice you want to repeat.</li>
        <li>Enable recurring billing and set the frequency (for example, monthly).</li>
        <li>Choose a start date and review the schedule.</li>
        <li>Save. New invoices are generated according to the schedule you set.</li>
      </ol>
      <p>
        Review generated invoices regularly to confirm amounts remain correct.
        Automatic reminders on Pro and Business can notify clients when payment
        is due.
      </p>
    </>
  ),
  "changing-subscription": (
    <>
      <p>
        Open Subscription in your account to view your current plan, billing
        interval, and renewal date.
      </p>
      <p>
        Upgrades take effect according to the terms shown at checkout. When
        moving to a higher plan, you gain access to the additional features
        immediately after payment is confirmed.
      </p>
      <p>
        Downgrades apply at the end of your current paid period unless stated
        otherwise at checkout. Your documents and clients remain in your account;
        features limited to higher plans become unavailable after the change
        takes effect.
      </p>
      <p>
        Paid subscriptions use secure checkout. {brand.productName} does not
        store card numbers.
      </p>
    </>
  ),
  cancelling: (
    <>
      <p>
        You can cancel a paid subscription online from the Subscription page.
        No phone call is required.
      </p>
      <p>
        After cancellation, your plan remains active until the end of the current
        billing period. You will not be charged again unless you resubscribe.
      </p>
      <p>
        When the paid period ends, your workspace moves to the Free plan unless
        you close your account. Documents you created remain accessible subject
        to Free plan limits for new activity.
      </p>
      <p>
        See our{" "}
        <Link href="/subscription-cancellation">Subscription Cancellation Policy</Link>{" "}
        for full details.
      </p>
    </>
  ),
  exporting: (
    <>
      <p>
        You can download a PDF of any invoice or quote from the document view.
        PDF downloads are available on all plans.
      </p>
      <p>
        CSV export of document and client data is available on Starter, Pro,
        and Business plans. Use Exports in your workspace to download data for
        your records or to import into other tools.
      </p>
      <p>
        Export files contain your business and client information. Store them
        securely and only share them where appropriate.
      </p>
    </>
  ),
  "closing-account": (
    <>
      <p>
        If you no longer need {brand.productName}, contact{" "}
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> from
        your registered email address and request account closure.
      </p>
      <p>
        Before closing, download any PDFs or CSV exports you need. Cancel any
        active paid subscription first to avoid further renewals.
      </p>
      <p>
        We process closure requests in line with our{" "}
        <Link href="/privacy">Privacy Policy</Link>. Some records may be retained
        where required by law or for legitimate business purposes, such as billing
        records.
      </p>
    </>
  ),
};
