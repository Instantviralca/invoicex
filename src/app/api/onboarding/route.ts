import { z } from "zod";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { saveOnboardingStep } from "@/lib/services/onboarding";
import {
  onboardingBrandingSchema,
  onboardingBusinessSchema,
  onboardingInvoiceSettingsSchema,
  onboardingTaxSchema,
  onboardingStepSchema,
} from "@/lib/validations/onboarding";

const bodySchema = onboardingStepSchema.extend({
  data: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  try {
    const { user, membership } = await requireAppContext();
    const body = await parseJsonBody(request, bodySchema);

    let validatedData: Record<string, unknown> | undefined;

    if (body.data && !body.skip) {
      switch (body.step) {
        case 1:
          validatedData = onboardingBusinessSchema.parse(body.data);
          break;
        case 2:
          validatedData = onboardingInvoiceSettingsSchema.parse(body.data);
          break;
        case 3:
          validatedData = onboardingTaxSchema.parse(body.data);
          break;
        case 4:
          validatedData = onboardingBrandingSchema.parse(body.data);
          break;
      }
    }

    const result = await saveOnboardingStep(
      user.id,
      membership.workspaceId,
      body.step,
      body.skip,
      validatedData,
    );

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
