import { type PlanId, plans, type PlanLimits } from "@/config/brand";
import {
  canAccessPaidFeatures,
  resolveLimitsPlanId,
  type SubscriptionStatus,
} from "@/lib/billing/access";

export class PlanLimitError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "documents"
      | "clients"
      | "templates"
      | "email"
      | "recurring"
      | "reminders"
      | "reports"
      | "catalogue"
      | "team"
      | "profiles"
      | "branding"
      | "colours",
  ) {
    super(message);
    this.name = "PlanLimitError";
  }
}

export function getPlanLimits(planId: PlanId): PlanLimits {
  return plans[planId].limits;
}

export function getEffectivePlanLimits(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
): PlanLimits {
  return getPlanLimits(resolveLimitsPlanId(planId, subscriptionStatus));
}

export function assertPaidFeatureAccess(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
  message: string,
  code: PlanLimitError["code"],
) {
  if (!canAccessPaidFeatures(planId, subscriptionStatus)) {
    throw new PlanLimitError(message, code);
  }
}

export function assertDocumentCapacity(
  planId: PlanId,
  documentsCreatedThisMonth: number,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  const limit = getEffectivePlanLimits(planId, subscriptionStatus)
    .documentsPerMonth;
  if (limit !== null && documentsCreatedThisMonth >= limit) {
    throw new PlanLimitError(
      `Your ${plans[planId].name} plan allows ${limit} invoices or quotes per month. Upgrade to create more.`,
      "documents",
    );
  }
}

export function assertClientCapacity(
  planId: PlanId,
  activeClients: number,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  const limit = getEffectivePlanLimits(planId, subscriptionStatus).activeClients;
  if (limit !== null && activeClients >= limit) {
    throw new PlanLimitError(
      `Your ${plans[planId].name} plan allows up to ${limit} active clients. Upgrade to add more.`,
      "clients",
    );
  }
}

export function assertTemplateAccess(
  planId: PlanId,
  template: "classic" | "modern" | "minimal",
  subscriptionStatus: SubscriptionStatus = "active",
) {
  if (
    !getEffectivePlanLimits(planId, subscriptionStatus).templates.includes(
      template,
    )
  ) {
    throw new PlanLimitError(
      `The ${template} template is not included in your plan. Upgrade to unlock all templates.`,
      "templates",
    );
  }
}

export function assertFeature(
  planId: PlanId,
  feature: keyof PlanLimits,
  message: string,
  code: PlanLimitError["code"],
  subscriptionStatus: SubscriptionStatus = "active",
) {
  assertPaidFeatureAccess(planId, subscriptionStatus, message, code);
  const limits = getEffectivePlanLimits(planId, subscriptionStatus);
  const value = limits[feature];
  if (value === false || value === 0) {
    throw new PlanLimitError(message, code);
  }
}

export function canRemoveBranding(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  return (
    canAccessPaidFeatures(planId, subscriptionStatus) &&
    getEffectivePlanLimits(planId, subscriptionStatus).removeBranding
  );
}

export function canEmailDocuments(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  return (
    canAccessPaidFeatures(planId, subscriptionStatus) &&
    getEffectivePlanLimits(planId, subscriptionStatus).emailDocuments
  );
}

export function canUseRecurring(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  return (
    canAccessPaidFeatures(planId, subscriptionStatus) &&
    getEffectivePlanLimits(planId, subscriptionStatus).recurringInvoices
  );
}

export function canUseReminders(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  return (
    canAccessPaidFeatures(planId, subscriptionStatus) &&
    getEffectivePlanLimits(planId, subscriptionStatus).automaticReminders
  );
}

export function canUseReports(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  return (
    canAccessPaidFeatures(planId, subscriptionStatus) &&
    getEffectivePlanLimits(planId, subscriptionStatus).reports
  );
}

export function canUseCatalogue(
  planId: PlanId,
  subscriptionStatus: SubscriptionStatus = "active",
) {
  return (
    canAccessPaidFeatures(planId, subscriptionStatus) &&
    getEffectivePlanLimits(planId, subscriptionStatus).catalogue
  );
}

export function maxTeamMembers(planId: PlanId) {
  return getPlanLimits(planId).teamMembers;
}

export function maxBusinessProfiles(planId: PlanId) {
  return getPlanLimits(planId).businessProfiles;
}
