import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businessProfiles, users } from "@/db/schema";
import type {
  onboardingBrandingSchema,
  onboardingBusinessSchema,
  onboardingInvoiceSettingsSchema,
  onboardingTaxSchema,
} from "@/lib/validations/onboarding";
import type { z } from "zod";

type BusinessData = z.infer<typeof onboardingBusinessSchema>;
type InvoiceSettingsData = z.infer<typeof onboardingInvoiceSettingsSchema>;
type TaxData = z.infer<typeof onboardingTaxSchema>;
type BrandingData = z.infer<typeof onboardingBrandingSchema>;

export async function saveOnboardingStep(
  userId: string,
  workspaceId: string,
  step: number,
  skip = false,
  data?: Record<string, unknown>,
) {
  const nextStep = skip ? step + 1 : step;

  await db
    .update(users)
    .set({
      onboardingStep: Math.min(nextStep, 5),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  const [profile] = await db
    .select()
    .from(businessProfiles)
    .where(eq(businessProfiles.workspaceId, workspaceId))
    .limit(1);

  if (!profile || !data) {
    return { step: nextStep };
  }

  if (step === 1) {
    const business = data as BusinessData;
    await db
      .update(businessProfiles)
      .set({
        tradingName: business.tradingName,
        legalName: business.legalName,
        businessType: business.businessType,
        email: business.email || profile.email,
        telephone: business.telephone,
        website: business.website,
        addressLine1: business.addressLine1,
        addressLine2: business.addressLine2,
        city: business.city,
        region: business.region,
        postcode: business.postcode,
        country: business.country,
        updatedAt: new Date(),
      })
      .where(eq(businessProfiles.id, profile.id));
  }

  if (step === 2) {
    const settings = data as InvoiceSettingsData;
    await db
      .update(businessProfiles)
      .set({
        invoicePrefix: settings.invoicePrefix,
        quotePrefix: settings.quotePrefix,
        defaultPaymentTermsDays: settings.defaultPaymentTermsDays,
        defaultInvoiceNotes: settings.defaultInvoiceNotes,
        defaultPaymentInstructions: settings.defaultPaymentInstructions,
        updatedAt: new Date(),
      })
      .where(eq(businessProfiles.id, profile.id));
  }

  if (step === 3) {
    const tax = data as TaxData;
    await db
      .update(businessProfiles)
      .set({
        vatRegistered: tax.vatRegistered,
        vatNumber: tax.vatNumber,
        defaultTaxRatePercent: tax.defaultTaxRatePercent,
        pricesInclusiveOfTax: tax.pricesInclusiveOfTax,
        updatedAt: new Date(),
      })
      .where(eq(businessProfiles.id, profile.id));
  }

  if (step === 4) {
    const branding = data as BrandingData;
    await db
      .update(businessProfiles)
      .set({
        accentColour: branding.accentColour,
        documentTemplate: branding.documentTemplate,
        updatedAt: new Date(),
      })
      .where(eq(businessProfiles.id, profile.id));
  }

  if (step >= 5 || nextStep > 5) {
    await db
      .update(users)
      .set({ onboardingCompleted: true, onboardingStep: 5, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  return { step: nextStep };
}

export async function getOnboardingState(userId: string) {
  const [user] = await db
    .select({
      onboardingCompleted: users.onboardingCompleted,
      onboardingStep: users.onboardingStep,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user;
}
