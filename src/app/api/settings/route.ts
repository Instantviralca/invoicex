import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { businessProfiles, users } from "@/db/schema";
import { requireAppContext } from "@/lib/app-context";
import { parseJsonBody } from "@/lib/api/parse";
import { handleApiError, jsonOk } from "@/lib/api/response";
import { assertPermission } from "@/lib/permissions";

const settingsSchema = z.object({
  section: z.enum([
    "profile",
    "business",
    "numbering",
    "tax",
    "branding",
  ]),
  data: z.record(z.string(), z.unknown()),
});

export async function PATCH(request: Request) {
  try {
    const { user, membership } = await requireAppContext();
    assertPermission(membership.role, "settings:update");

    const body = await parseJsonBody(request, settingsSchema);

    if (body.section === "profile") {
      const profileData = z
        .object({
          name: z.string().trim().min(1).optional(),
        })
        .parse(body.data);

      if (profileData.name) {
        await db
          .update(users)
          .set({ name: profileData.name, updatedAt: new Date() })
          .where(eq(users.id, user.id));
      }
    } else {
      const [profile] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.workspaceId, membership.workspaceId))
        .limit(1);

      if (!profile) throw new Error("Business profile not found.");

      const updates: Record<string, unknown> = { updatedAt: new Date() };

      if (body.section === "business") {
        const data = z
          .object({
            tradingName: z.string().optional(),
            legalName: z.string().optional(),
            email: z.string().optional(),
            telephone: z.string().optional(),
            addressLine1: z.string().optional(),
            city: z.string().optional(),
            postcode: z.string().optional(),
          })
          .parse(body.data);
        Object.assign(updates, data);
      }

      if (body.section === "numbering") {
        const data = z
          .object({
            invoicePrefix: z.string().optional(),
            quotePrefix: z.string().optional(),
            defaultPaymentTermsDays: z.number().optional(),
          })
          .parse(body.data);
        Object.assign(updates, data);
      }

      if (body.section === "tax") {
        const data = z
          .object({
            vatRegistered: z.boolean().optional(),
            vatNumber: z.string().optional(),
            defaultTaxRatePercent: z.string().optional(),
            pricesInclusiveOfTax: z.boolean().optional(),
          })
          .parse(body.data);
        Object.assign(updates, data);
      }

      if (body.section === "branding") {
        const data = z
          .object({
            accentColour: z.string().optional(),
            documentTemplate: z.enum(["classic", "modern", "minimal"]).optional(),
          })
          .parse(body.data);
        Object.assign(updates, data);
      }

      await db
        .update(businessProfiles)
        .set(updates)
        .where(eq(businessProfiles.id, profile.id));
    }

    return jsonOk({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
