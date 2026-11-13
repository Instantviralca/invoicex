import Link from "next/link";
import {
  brand,
  company,
  cookieConsentVersion,
  pricingNotes,
  serviceDisclaimer,
  subscriptionBillingClarity,
} from "@/config/brand";
import type { LegalSection } from "@/components/marketing/legal-document";

const companyBlock = (
  <>
    <p>
      {company.legalName} (company number {company.companyNumber}), registered in{" "}
      {company.registeredJurisdiction}. Registered office:{" "}
      {company.registeredOfficeSingleLine}.
    </p>
    <p>
      Contact:{" "}
      <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>
      {" · "}
      <a href={`tel:${brand.supportPhoneTel}`}>{brand.supportPhone}</a>
    </p>
  </>
);

export const privacySections: LegalSection[] = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <>
        <p>
          This Privacy Policy explains how {company.legalName} (&quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;) collects, uses, and protects personal
          data when you use {brand.productName} at {brand.domain} (the
          &quot;Service&quot;).
        </p>
        <p>
          We are the data controller for personal data processed through the
          Service. For data protection enquiries, contact{" "}
          <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
        </p>
        {companyBlock}
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "2. Data we collect",
    content: (
      <>
        <p>We may collect and process the following categories of data:</p>
        <ul>
          <li>
            <strong>Account data:</strong> name, email address, password hash,
            verification status, and marketing preferences.
          </li>
          <li>
            <strong>Business data:</strong> trading name, address, VAT number,
            bank details, logo, and other information you enter for documents.
          </li>
          <li>
            <strong>Client data:</strong> names, addresses, and contact details
            you store about your clients.
          </li>
          <li>
            <strong>Document data:</strong> invoices, quotes, line items,
            amounts, and related metadata.
          </li>
          <li>
            <strong>Billing data:</strong> subscription plan, billing interval,
            and payment status. Card details are processed by our payment
            provider; we do not store full card numbers.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser type, device
            information, and logs required for security and operation.
          </li>
          <li>
            <strong>Communications:</strong> messages you send via our contact
            form or support email.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-data",
    title: "3. How we use your data",
    content: (
      <>
        <p>We use personal data to:</p>
        <ul>
          <li>Provide, maintain, and improve the Service</li>
          <li>Create and deliver documents you request</li>
          <li>Process subscriptions and send service-related emails</li>
          <li>Respond to support requests</li>
          <li>Protect against fraud, abuse, and security incidents</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          Our lawful bases under UK GDPR include contract performance, legitimate
          interests (such as security and product improvement), consent where
          required (for example, non-essential cookies or marketing where
          applicable), and legal obligation.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "4. Sharing your data",
    content: (
      <>
        <p>We share data only where necessary:</p>
        <ul>
          <li>
            <strong>Payment provider:</strong> payment processing for paid
            subscriptions. The provider processes payment details according to
            its own privacy policy.
          </li>
          <li>
            <strong>Infrastructure providers:</strong> hosting, email delivery,
            and monitoring services bound by contractual confidentiality and
            security obligations.
          </li>
          <li>
            <strong>Professional advisers:</strong> where required for legal,
            accounting, or compliance purposes.
          </li>
          <li>
            <strong>Authorities:</strong> when required by law or to protect
            rights and safety.
          </li>
        </ul>
        <p>We do not sell your personal data.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "5. Data retention",
    content: (
      <>
        <p>
          We retain account and document data while your account is active and
          for a reasonable period afterwards to allow reactivation, resolve
          disputes, and meet legal requirements.
        </p>
        <p>
          Billing records may be retained for the period required by tax and
          company law. When you request account closure, we delete or anonymise
          data where we no longer have a lawful basis to retain it, subject to
          legal exceptions.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "6. Your rights",
    content: (
      <>
        <p>
          Under UK data protection law, you may have the right to access, rectify,
          erase, restrict processing, object, and data portability, depending on
          the circumstances. You may also withdraw consent where processing is
          based on consent.
        </p>
        <p>
          To exercise your rights, email{" "}
          <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>. You
          may lodge a complaint with the Information Commissioner&apos;s Office
          (ICO) if you believe processing violates applicable law.
        </p>
      </>
    ),
  },
  {
    id: "international",
    title: "7. International transfers",
    content: (
      <p>
        Where data is transferred outside the UK, we ensure appropriate safeguards
        are in place, such as UK adequacy regulations or standard contractual
        clauses approved for international transfers.
      </p>
    ),
  },
  {
    id: "security",
    title: "8. Security",
    content: (
      <p>
        We implement technical and organisational measures to protect personal
        data. See our{" "}
        <Link href="/security">Security page</Link> for an overview. No online
        service can guarantee absolute security.
      </p>
    ),
  },
  {
    id: "cookies",
    title: "9. Cookies",
    content: (
      <p>
        We use cookies and similar technologies as described in our{" "}
        <Link href="/cookie-policy">Cookie Policy</Link>.
      </p>
    ),
  },
  {
    id: "changes",
    title: "10. Changes to this policy",
    content: (
      <p>
        We may update this Privacy Policy from time to time. The &quot;Last
        updated&quot; date at the top will change when we do. Material changes
        may be notified by email or through the Service.
      </p>
    ),
  },
];

export const termsSections: LegalSection[] = [
  {
    id: "agreement",
    title: "1. Agreement to terms",
    content: (
      <>
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use
          of {brand.productName}, provided by {company.legalName}. By creating an
          account or using the Service, you agree to these Terms and our{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
        {companyBlock}
      </>
    ),
  },
  {
    id: "service",
    title: "2. The Service",
    content: (
      <>
        <p>
          {brand.productName} is document and business administration software
          that enables users to create invoices and quotes, manage clients,
          download PDFs, and — depending on plan — email documents, use recurring
          billing, access reports, and collaborate as a team.
        </p>
        <p>{serviceDisclaimer}</p>
        <p>{subscriptionBillingClarity}</p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "3. Accounts and eligibility",
    content: (
      <>
        <p>
          You must be at least 18 years old and able to enter a binding contract.
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity under your account.
        </p>
        <p>
          Information you provide must be accurate. You must not create accounts
          for fraudulent or abusive purposes.
        </p>
      </>
    ),
  },
  {
    id: "subscriptions",
    title: "4. Subscriptions and billing",
    content: (
      <>
        <p>
          Plans and features are described on our{" "}
          <Link href="/pricing">Pricing page</Link>. {pricingNotes.vatNote}{" "}
          {pricingNotes.renewal}
        </p>
        <p>{pricingNotes.processor}</p>
        <p>{subscriptionBillingClarity}</p>
        <p>
          Refunds are handled under our{" "}
          <Link href="/refund-policy">Refund Policy</Link>. Cancellation is
          explained in our{" "}
          <Link href="/subscription-cancellation">
            Subscription Cancellation Policy
          </Link>
          .
        </p>
        <p>{pricingNotes.fairUse}</p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "5. Your content and responsibilities",
    content: (
      <>
        <p>
          You retain ownership of content you upload or enter. You grant us a
          licence to host, process, and display that content solely to provide
          the Service.
        </p>
        <p>
          You are solely responsible for the accuracy, legality, and tax treatment
          of invoices, quotes, and other documents you issue. You must comply with
          applicable law, including VAT and consumer regulations where relevant.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable use",
    content: (
      <p>
        You must use the Service in accordance with our{" "}
        <Link href="/acceptable-use">Acceptable Use Policy</Link>. We may suspend
        or terminate accounts that violate these Terms or applicable law.
      </p>
    ),
  },
  {
    id: "availability",
    title: "7. Availability and changes",
    content: (
      <>
        <p>
          We aim to keep the Service available but do not guarantee uninterrupted
          access. We may modify features, plans, or pricing with reasonable notice
          where required.
        </p>
        <p>
          We are not liable for delays or failures caused by events outside our
          reasonable control.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "8. Limitation of liability",
    content: (
      <>
        <p>
          Nothing in these Terms excludes liability that cannot be excluded under
          applicable law, including liability for death or personal injury caused
          by negligence, or fraud.
        </p>
        <p>
          Subject to the above, we are not liable for indirect, incidental, or
          consequential losses, loss of profits, loss of data, or business
          interruption. Our total liability arising from the Service in any
          twelve-month period is limited to the fees you paid to us in that
          period, or £100 if you use the Free plan.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "9. Termination",
    content: (
      <>
        <p>
          You may close your account by contacting support. We may suspend or
          terminate access if you breach these Terms or if required for legal or
          security reasons.
        </p>
        <p>
          On termination, your right to use the Service ends. Provisions that by
          nature should survive (including liability limits and governing law)
          continue to apply.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "10. Governing law",
    content: (
      <p>
        These Terms are governed by the laws of England and Wales. Disputes are
        subject to the exclusive jurisdiction of the courts of England and Wales,
        without prejudice to mandatory consumer rights that may apply where you
        are resident elsewhere in the United Kingdom.
      </p>
    ),
  },
];

export const refundSections: LegalSection[] = [
  {
    id: "overview",
    title: "1. Overview",
    content: (
      <>
        <p>
          This Refund Policy explains when {company.legalName} may provide refunds
          for paid {brand.productName} subscriptions.
        </p>
        {companyBlock}
      </>
    ),
  },
  {
    id: "free-plan",
    title: "2. Free plan",
    content: (
      <p>
        The Free plan does not involve payment. No refund applies because no
        charge is made.
      </p>
    ),
  },
  {
    id: "paid-subscriptions",
    title: "3. Paid subscriptions",
    content: (
      <>
        <p>
          Paid subscriptions renew automatically each billing period unless
          cancelled before renewal. {pricingNotes.cancellation}
        </p>
        <p>
          Because the Service is digital and access begins immediately after
          payment, fees are generally non-refundable once a billing period has
          started, except where required by law or as set out below.
        </p>
      </>
    ),
  },
  {
    id: "exceptions",
    title: "4. When we may refund",
    content: (
      <>
        <p>We may issue a refund at our discretion or where required by law if:</p>
        <ul>
          <li>You were charged in error or duplicated charges occurred</li>
          <li>A technical fault prevented meaningful use of paid features for a sustained period and we could not resolve it promptly</li>
          <li>Consumer cancellation rights apply to your purchase under applicable UK law</li>
        </ul>
        <p>
          Refund requests should be sent to{" "}
          <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a> with
          your account email and payment details sufficient for us to locate the
          transaction.
        </p>
      </>
    ),
  },
  {
    id: "payment-processor",
    title: "5. Payment processor",
    content: (
      <p>
        Payments are processed by our payment provider. Approved refunds are
        returned via the original payment method where possible. Processing times
        depend on your bank or card issuer.
      </p>
    ),
  },
  {
    id: "chargebacks",
    title: "6. Chargebacks",
    content: (
      <p>
        If you dispute a charge with your bank before contacting us, we may suspend
        your account while the dispute is investigated. Please email support first
        so we can resolve billing issues quickly.
      </p>
    ),
  },
];

export const cancellationSections: LegalSection[] = [
  {
    id: "how-to-cancel",
    title: "1. How to cancel",
    content: (
      <>
        <p>
          You can cancel a paid subscription online from the Subscription page in
          your account. No phone call is required. {pricingNotes.cancellation}
        </p>
        {companyBlock}
      </>
    ),
  },
  {
    id: "effect",
    title: "2. Effect of cancellation",
    content: (
      <>
        <p>
          Cancellation stops future renewals. You retain access to paid features
          until the end of the current billing period. After that, your workspace
          moves to the Free plan unless you close your account.
        </p>
        <p>
          Documents and clients you created remain in your account, subject to Free
          plan limits for new activity.
        </p>
      </>
    ),
  },
  {
    id: "annual",
    title: "3. Annual billing",
    content: (
      <p>
        If you pay annually, cancellation prevents renewal at the end of the
        twelve-month term. Fees already paid for the current term are not refunded
        except as described in our{" "}
        <Link href="/refund-policy">Refund Policy</Link>.
      </p>
    ),
  },
  {
    id: "account-closure",
    title: "4. Account closure",
    content: (
      <p>
        Cancelling a subscription is not the same as closing your account. To
        request account closure, see our help article on{" "}
        <Link href="/help/closing-account">closing your account</Link>.
      </p>
    ),
  },
];

export const cookieSections: LegalSection[] = [
  {
    id: "what-are-cookies",
    title: "1. What are cookies?",
    content: (
      <p>
        Cookies are small text files stored on your device when you visit a
        website. We also use similar technologies such as local storage for
        essential preferences like cookie consent.
      </p>
    ),
  },
  {
    id: "how-we-use",
    title: "2. How we use cookies",
    content: (
      <>
        <p>We use cookies in the following categories:</p>
        <ul>
          <li>
            <strong>Strictly necessary:</strong> required for authentication,
            security, and core functionality. These cannot be switched off in our
            systems.
          </li>
          <li>
            <strong>Preferences:</strong> remember choices such as cookie consent
            (version {cookieConsentVersion}).
          </li>
          <li>
            <strong>Analytics:</strong> where enabled with your consent, help us
            understand how the Service is used so we can improve it.
          </li>
        </ul>
        <p>
          You can manage non-essential cookies through the cookie banner or
          &quot;Cookie preferences&quot; link in the footer.
        </p>
      </>
    ),
  },
  {
    id: "third-party",
    title: "3. Third-party cookies",
    content: (
      <p>
        Our payment provider may set cookies when you complete checkout on their
        payment pages. Third-party cookies are governed by the relevant
        provider&apos;s policy.
      </p>
    ),
  },
  {
    id: "browser-controls",
    title: "4. Browser controls",
    content: (
      <p>
        Most browsers allow you to block or delete cookies. Blocking strictly
        necessary cookies may prevent you from signing in or using core features.
      </p>
    ),
  },
];

export const acceptableUseSections: LegalSection[] = [
  {
    id: "purpose",
    title: "1. Purpose",
    content: (
      <p>
        This Acceptable Use Policy sets rules for using {brand.productName}. It
        forms part of our{" "}
        <Link href="/terms">Terms of Service</Link>.
      </p>
    ),
  },
  {
    id: "permitted",
    title: "2. Permitted use",
    content: (
      <p>
        Use the Service to create and manage legitimate business documents for
        yourself or your organisation, in compliance with applicable law and your
        plan limits.
      </p>
    ),
  },
  {
    id: "prohibited",
    title: "3. Prohibited conduct",
    content: (
      <>
        <p>You must not:</p>
        <ul>
          <li>Use the Service for unlawful, fraudulent, or misleading activity</li>
          <li>Send spam, phishing messages, or bulk unsolicited email via the platform</li>
          <li>Attempt to bypass plan limits, security controls, or rate limits</li>
          <li>Upload malware or interfere with the Service or other users</li>
          <li>Impersonate others or misrepresent your business identity</li>
          <li>Scrape or harvest data from the Service without permission</li>
          <li>Use unlimited plans in a way that violates fair use, including automated abuse</li>
        </ul>
      </>
    ),
  },
  {
    id: "enforcement",
    title: "4. Enforcement",
    content: (
      <p>
        We may warn, suspend, or terminate accounts that violate this policy. We
        may report illegal activity to relevant authorities where appropriate.
      </p>
    ),
  },
];

export const securitySections: LegalSection[] = [
  {
    id: "commitment",
    title: "1. Our commitment",
    content: (
      <>
        <p>
          {company.legalName} takes reasonable steps to protect data processed
          through {brand.productName}. Security is shared: you also play a role by
          using a strong password and keeping credentials confidential.
        </p>
        {companyBlock}
      </>
    ),
  },
  {
    id: "measures",
    title: "2. Technical measures",
    content: (
      <>
        <p>Measures we apply include, where appropriate:</p>
        <ul>
          <li>Encrypted connections (HTTPS) for data in transit</li>
          <li>Hashed password storage</li>
          <li>Session security and authentication controls</li>
          <li>Rate limiting on sensitive endpoints</li>
          <li>Access controls within our infrastructure</li>
          <li>Logging and monitoring for security events</li>
        </ul>
      </>
    ),
  },
  {
    id: "payments",
    title: "3. Payment security",
    content: (
      <p>
        {pricingNotes.processor} We receive payment confirmations and
        subscription status from our payment provider, not your full card details.
      </p>
    ),
  },
  {
    id: "your-role",
    title: "4. Your responsibilities",
    content: (
      <>
        <p>You should:</p>
        <ul>
          <li>Use a unique, strong password</li>
          <li>Sign out on shared devices</li>
          <li>Report suspected unauthorised access promptly</li>
          <li>Keep exported PDFs and CSV files secure</li>
        </ul>
      </>
    ),
  },
  {
    id: "incidents",
    title: "5. Security incidents",
    content: (
      <p>
        If we become aware of a personal data breach likely to affect your rights,
        we will notify you and the ICO where required by UK law. Report security
        concerns to{" "}
        <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>.
      </p>
    ),
  },
];
