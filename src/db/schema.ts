import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const planIdEnum = pgEnum("plan_id", [
  "free",
  "starter",
  "pro",
  "business",
]);
export const billingIntervalEnum = pgEnum("billing_interval", [
  "month",
  "year",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "pending",
  "cancelled",
  "expired",
  "past_due",
  "trialing",
]);
export const memberRoleEnum = pgEnum("member_role", [
  "owner",
  "administrator",
  "staff",
  "viewer",
]);
export const clientTypeEnum = pgEnum("client_type", ["business", "individual"]);
export const catalogueTypeEnum = pgEnum("catalogue_type", [
  "product",
  "service",
]);
export const invoiceBaseStatusEnum = pgEnum("invoice_base_status", [
  "draft",
  "sent",
  "viewed",
  "partially_paid",
  "paid",
  "void",
  "archived",
]);
export const quoteBaseStatusEnum = pgEnum("quote_base_status", [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "converted",
  "archived",
]);
export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "sent",
  "delivered",
  "failed",
  "bounced",
]);
export const templateEnum = pgEnum("document_template", [
  "classic",
  "modern",
  "minimal",
]);
export const recurringFrequencyEnum = pgEnum("recurring_frequency", [
  "weekly",
  "monthly",
  "quarterly",
  "semiannual",
  "annually",
  "custom",
]);
export const adminRoleEnum = pgEnum("admin_role", [
  "superadmin",
  "support",
  "readonly",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  passwordHash: text("password_hash"),
  image: text("image"),
  marketingConsent: boolean("marketing_consent").default(false).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  onboardingStep: integer("onboarding_step").default(1).notNull(),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  suspendedReason: text("suspended_reason"),
  ...timestamps,
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [uniqueIndex("accounts_provider_idx").on(t.provider, t.providerAccountId)],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (t) => [uniqueIndex("verification_token_idx").on(t.identifier, t.token)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  planId: planIdEnum("plan_id").default("free").notNull(),
  ...timestamps,
});

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull(),
    invitedEmail: text("invited_email"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("workspace_member_unique").on(t.workspaceId, t.userId),
    index("workspace_members_user_idx").on(t.userId),
  ],
);

export const businessProfiles = pgTable(
  "business_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    tradingName: text("trading_name").notNull(),
    legalName: text("legal_name"),
    businessType: text("business_type"),
    companyNumber: text("company_number"),
    email: text("email"),
    telephone: text("telephone"),
    website: text("website"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    city: text("city"),
    region: text("region"),
    postcode: text("postcode"),
    country: text("country").default("GB").notNull(),
    defaultCurrency: varchar("default_currency", { length: 3 })
      .default("GBP")
      .notNull(),
    timeZone: text("time_zone").default("Europe/London").notNull(),
    invoicePrefix: text("invoice_prefix").default("INV-").notNull(),
    nextInvoiceNumber: integer("next_invoice_number").default(1).notNull(),
    quotePrefix: text("quote_prefix").default("QUO-").notNull(),
    nextQuoteNumber: integer("next_quote_number").default(1).notNull(),
    defaultPaymentTermsDays: integer("default_payment_terms_days")
      .default(30)
      .notNull(),
    defaultInvoiceNotes: text("default_invoice_notes"),
    defaultQuoteNotes: text("default_quote_notes"),
    defaultPaymentInstructions: text("default_payment_instructions"),
    vatRegistered: boolean("vat_registered").default(false).notNull(),
    vatNumber: text("vat_number"),
    defaultTaxRatePercent: text("default_tax_rate_percent").default("0").notNull(),
    pricesInclusiveOfTax: boolean("prices_inclusive_of_tax")
      .default(false)
      .notNull(),
    logoFileId: uuid("logo_file_id"),
    accentColour: text("accent_colour").default("#1D4ED8").notNull(),
    documentTemplate: templateEnum("document_template")
      .default("classic")
      .notNull(),
    isDefault: boolean("is_default").default(true).notNull(),
    ...timestamps,
  },
  (t) => [index("business_profiles_workspace_idx").on(t.workspaceId)],
);

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    businessProfileId: uuid("business_profile_id").references(
      () => businessProfiles.id,
    ),
    clientType: clientTypeEnum("client_type").default("business").notNull(),
    contactName: text("contact_name").notNull(),
    businessName: text("business_name"),
    email: text("email"),
    telephone: text("telephone"),
    billingAddressLine1: text("billing_address_line1"),
    billingAddressLine2: text("billing_address_line2"),
    billingCity: text("billing_city"),
    billingRegion: text("billing_region"),
    billingPostcode: text("billing_postcode"),
    billingCountry: text("billing_country").default("GB"),
    serviceAddressLine1: text("service_address_line1"),
    serviceAddressLine2: text("service_address_line2"),
    serviceCity: text("service_city"),
    serviceRegion: text("service_region"),
    servicePostcode: text("service_postcode"),
    serviceCountry: text("service_country"),
    companyNumber: text("company_number"),
    vatNumber: text("vat_number"),
    defaultCurrency: varchar("default_currency", { length: 3 }).default("GBP"),
    defaultPaymentTermsDays: integer("default_payment_terms_days"),
    internalNotes: text("internal_notes"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("clients_workspace_idx").on(t.workspaceId),
    index("clients_email_idx").on(t.workspaceId, t.email),
  ],
);

export const catalogueItems = pgTable(
  "catalogue_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sku: text("sku"),
    type: catalogueTypeEnum("type").default("service").notNull(),
    unit: text("unit").default("unit").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    defaultTaxRatePercent: text("default_tax_rate_percent").default("0").notNull(),
    currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("catalogue_workspace_idx").on(t.workspaceId)],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    businessProfileId: uuid("business_profile_id")
      .notNull()
      .references(() => businessProfiles.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    sourceQuoteId: uuid("source_quote_id"),
    invoiceNumber: text("invoice_number").notNull(),
    status: invoiceBaseStatusEnum("status").default("draft").notNull(),
    issueDate: date("issue_date").notNull(),
    dueDate: date("due_date").notNull(),
    currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
    customerReference: text("customer_reference"),
    billingAddressSnapshot: jsonb("billing_address_snapshot"),
    serviceAddressSnapshot: jsonb("service_address_snapshot"),
    subtotalMinor: integer("subtotal_minor").default(0).notNull(),
    discountTotalMinor: integer("discount_total_minor").default(0).notNull(),
    taxTotalMinor: integer("tax_total_minor").default(0).notNull(),
    shippingMinor: integer("shipping_minor").default(0).notNull(),
    grandTotalMinor: integer("grand_total_minor").default(0).notNull(),
    amountPaidMinor: integer("amount_paid_minor").default(0).notNull(),
    notes: text("notes"),
    paymentInstructions: text("payment_instructions"),
    terms: text("terms"),
    footerNote: text("footer_note"),
    template: templateEnum("template").default("classic").notNull(),
    accentColour: text("accent_colour"),
    pricesInclusiveOfTax: boolean("prices_inclusive_of_tax")
      .default(false)
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    publicToken: text("public_token").unique(),
    remindersEnabled: boolean("reminders_enabled").default(true).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("invoice_number_workspace_idx").on(
      t.workspaceId,
      t.invoiceNumber,
    ),
    index("invoices_workspace_status_idx").on(t.workspaceId, t.status),
    index("invoices_due_date_idx").on(t.workspaceId, t.dueDate),
  ],
);

export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    catalogueItemId: uuid("catalogue_item_id"),
    position: integer("position").default(0).notNull(),
    description: text("description").notNull(),
    quantity: text("quantity").notNull(),
    unit: text("unit").default("unit").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    discountMinor: integer("discount_minor").default(0).notNull(),
    taxRatePercent: text("tax_rate_percent").default("0").notNull(),
    lineSubtotalMinor: integer("line_subtotal_minor").default(0).notNull(),
    lineTaxMinor: integer("line_tax_minor").default(0).notNull(),
    lineTotalMinor: integer("line_total_minor").default(0).notNull(),
  },
  (t) => [index("invoice_lines_invoice_idx").on(t.invoiceId)],
);

export const invoiceSnapshots = pgTable("invoice_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid("created_by_user_id"),
});

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    businessProfileId: uuid("business_profile_id")
      .notNull()
      .references(() => businessProfiles.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    quoteNumber: text("quote_number").notNull(),
    status: quoteBaseStatusEnum("status").default("draft").notNull(),
    issueDate: date("issue_date").notNull(),
    validUntil: date("valid_until").notNull(),
    currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
    customerReference: text("customer_reference"),
    billingAddressSnapshot: jsonb("billing_address_snapshot"),
    subtotalMinor: integer("subtotal_minor").default(0).notNull(),
    discountTotalMinor: integer("discount_total_minor").default(0).notNull(),
    taxTotalMinor: integer("tax_total_minor").default(0).notNull(),
    shippingMinor: integer("shipping_minor").default(0).notNull(),
    grandTotalMinor: integer("grand_total_minor").default(0).notNull(),
    notes: text("notes"),
    terms: text("terms"),
    footerNote: text("footer_note"),
    template: templateEnum("template").default("classic").notNull(),
    accentColour: text("accent_colour"),
    pricesInclusiveOfTax: boolean("prices_inclusive_of_tax")
      .default(false)
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    convertedInvoiceId: uuid("converted_invoice_id"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("quote_number_workspace_idx").on(t.workspaceId, t.quoteNumber),
    index("quotes_workspace_status_idx").on(t.workspaceId, t.status),
  ],
);

export const quoteLineItems = pgTable(
  "quote_line_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    catalogueItemId: uuid("catalogue_item_id"),
    position: integer("position").default(0).notNull(),
    description: text("description").notNull(),
    quantity: text("quantity").notNull(),
    unit: text("unit").default("unit").notNull(),
    unitPriceMinor: integer("unit_price_minor").notNull(),
    discountMinor: integer("discount_minor").default(0).notNull(),
    taxRatePercent: text("tax_rate_percent").default("0").notNull(),
    lineSubtotalMinor: integer("line_subtotal_minor").default(0).notNull(),
    lineTaxMinor: integer("line_tax_minor").default(0).notNull(),
    lineTotalMinor: integer("line_total_minor").default(0).notNull(),
  },
  (t) => [index("quote_lines_quote_idx").on(t.quoteId)],
);

export const quoteSnapshots = pgTable("quote_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quotePublicTokens = pgTable("quote_public_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const quoteResponses = pgTable("quote_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // accept | reject
  respondentName: text("respondent_name").notNull(),
  comment: text("comment"),
  ipHash: text("ip_hash"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const paymentRecords = pgTable(
  "payment_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    amountMinor: integer("amount_minor").notNull(),
    currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    method: text("method"),
    reference: text("reference"),
    notes: text("notes"),
    /** User-entered records only — not processed by InvoiceX. */
    isUserEntered: boolean("is_user_entered").default(true).notNull(),
    createdByUserId: uuid("created_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("payment_records_invoice_idx").on(t.invoiceId)],
);

export const recurringInvoices = pgTable(
  "recurring_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    businessProfileId: uuid("business_profile_id")
      .notNull()
      .references(() => businessProfiles.id),
    templateInvoiceId: uuid("template_invoice_id").references(() => invoices.id),
    frequency: recurringFrequencyEnum("frequency").notNull(),
    customIntervalDays: integer("custom_interval_days"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    nextRunDate: date("next_run_date").notNull(),
    autoSend: boolean("auto_send").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    lastRunKey: text("last_run_key"),
    lineItemsTemplate: jsonb("line_items_template").notNull(),
    notes: text("notes"),
    terms: text("terms"),
    paymentInstructions: text("payment_instructions"),
    currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
    ...timestamps,
  },
  (t) => [index("recurring_next_run_idx").on(t.nextRunDate, t.active)],
);

export const reminderSchedules = pgTable("reminder_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, {
    onDelete: "cascade",
  }),
  clientId: uuid("client_id").references(() => clients.id, {
    onDelete: "cascade",
  }),
  offsetDays: integer("offset_days").notNull(), // negative = before due
  enabled: boolean("enabled").default(true).notNull(),
  lastSentKey: text("last_sent_key"),
  ...timestamps,
});

export const emailLogs = pgTable(
  "email_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id"),
    toEmail: text("to_email").notNull(),
    subject: text("subject").notNull(),
    template: text("template").notNull(),
    status: emailStatusEnum("status").default("queued").notNull(),
    providerMessageId: text("provider_message_id"),
    relatedType: text("related_type"),
    relatedId: uuid("related_id"),
    errorMessage: text("error_message"),
    ...timestamps,
  },
  (t) => [index("email_logs_workspace_idx").on(t.workspaceId)],
);

export const fileAssets = pgTable("file_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, {
    onDelete: "cascade",
  }),
  uploadedByUserId: uuid("uploaded_by_user_id"),
  storageKey: text("storage_key").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  purpose: text("purpose").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" })
      .unique(),
    planId: planIdEnum("plan_id").default("free").notNull(),
    interval: billingIntervalEnum("interval").default("month").notNull(),
    status: subscriptionStatusEnum("status").default("active").notNull(),
    mollieCustomerId: text("mollie_customer_id"),
    mollieSubscriptionId: text("mollie_subscription_id"),
    mollieMandateId: text("mollie_mandate_id"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    pendingPlanId: planIdEnum("pending_plan_id"),
    pendingInterval: billingIntervalEnum("pending_interval"),
    ...timestamps,
  },
  (t) => [index("subscriptions_mollie_idx").on(t.mollieSubscriptionId)],
);

export const subscriptionEvents = pgTable("subscription_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
    onDelete: "set null",
  }),
  eventType: text("event_type").notNull(),
  mollieResourceId: text("mollie_resource_id"),
  payload: jsonb("payload"),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const molliePayments = pgTable(
  "mollie_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    molliePaymentId: text("mollie_payment_id").notNull().unique(),
    mollieCustomerId: text("mollie_customer_id"),
    status: text("status").notNull(),
    amountValue: text("amount_value").notNull(),
    amountCurrency: text("amount_currency").notNull(),
    sequenceType: text("sequence_type"),
    description: text("description"),
    metadata: jsonb("metadata"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index("mollie_payments_workspace_idx").on(t.workspaceId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id"),
    actorUserId: uuid("actor_user_id"),
    actorAdminId: uuid("actor_admin_id"),
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_workspace_idx").on(t.workspaceId)],
);

export const contactSubmissions = pgTable("contact_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  ipHash: text("ip_hash"),
  honeypot: text("honeypot"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const usageCounters = pgTable(
  "usage_counters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    periodKey: text("period_key").notNull(), // YYYY-MM
    documentsCreated: integer("documents_created").default(0).notNull(),
    emailsSent: integer("emails_sent").default(0).notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("usage_workspace_period_idx").on(t.workspaceId, t.periodKey),
  ],
);

export const dataExportRequests = pgTable("data_export_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  status: text("status").default("pending").notNull(),
  fileAssetId: uuid("file_asset_id"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
});

export const accountDeletionRequests = pgTable("account_deletion_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  workspaceId: uuid("workspace_id"),
  status: text("status").default("pending").notNull(),
  confirmationText: text("confirmation_text").notNull(),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  ...timestamps,
});

export const cookieConsents = pgTable("cookie_consents", {
  id: uuid("id").defaultRandom().primaryKey(),
  anonymousId: text("anonymous_id"),
  userId: uuid("user_id"),
  version: text("version").notNull(),
  necessary: boolean("necessary").default(true).notNull(),
  analytics: boolean("analytics").default(false).notNull(),
  marketing: boolean("marketing").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: adminRoleEnum("role").default("support").notNull(),
  ...timestamps,
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminUserId: uuid("admin_user_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const supportNotes = pgTable("support_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  adminUserId: uuid("admin_user_id")
    .notNull()
    .references(() => adminUsers.id),
  workspaceId: uuid("workspace_id"),
  userId: uuid("user_id"),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    jobName: text("job_name").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    status: text("status").notNull(),
    attempts: integer("attempts").default(1).notNull(),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    metadata: jsonb("metadata"),
  },
  (t) => [index("job_runs_name_idx").on(t.jobName)],
);

export const webhookFailures = pgTable("webhook_failures", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").default("mollie").notNull(),
  resourceId: text("resource_id"),
  payload: jsonb("payload"),
  errorMessage: text("error_message").notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** WooCommerce remote Mollie payment orders (server-side payment hub). */
export const remoteOrders = pgTable(
  "remote_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientOrderId: text("client_order_id").notNull(),
    accessToken: text("access_token").notNull(),
    callbackUrl: text("callback_url").notNull(),
    returnUrl: text("return_url").notNull(),
    cancelUrl: text("cancel_url").notNull(),
    amount: text("amount").notNull(),
    currency: varchar("currency", { length: 3 }).notNull(),
    productName: text("product_name").notNull(),
    merchantOrderNumber: text("merchant_order_number"),
    integrationMode: text("integration_mode").default("").notNull(),
    items: jsonb("items").notNull(),
    molliePaymentId: text("mollie_payment_id"),
    mollieCheckoutUrl: text("mollie_checkout_url"),
    paymentStatus: text("payment_status").default("created").notNull(),
    paymentMethod: text("payment_method"),
    callbackSentAt: timestamp("callback_sent_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("remote_orders_mollie_payment_idx").on(t.molliePaymentId),
    index("remote_orders_client_order_idx").on(t.clientOrderId),
  ],
);

/** Replay protection for signed remote payment create requests. */
export const remotePaymentNonces = pgTable("remote_payment_nonces", {
  nonceHash: text("nonce_hash").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations (selected)
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(workspaceMembers),
}));

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  members: many(workspaceMembers),
  subscription: one(subscriptions),
  clients: many(clients),
  invoices: many(invoices),
}));
