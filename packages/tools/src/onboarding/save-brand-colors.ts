import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  brandGuidelineColors,
  brandGuidelines,
  brandSettings,
} from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { saveBrandColorsInputSchema } from "../schemas/onboarding-tools";
import { requireOrganizationId } from "../utils/organization";

export function createSaveBrandColorsTool() {
  return defineTool({
    description:
      "Save the researched brand colors to the organization's brand guidelines. Skips without overwriting when colors already exist. Use exact color values quoted in the research brief.",
    inputSchema: saveBrandColorsInputSchema,
    async execute({ colors }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const settings = await db.query.brandSettings.findFirst({
        columns: { id: true },
        orderBy: [desc(brandSettings.isDefault)],
        where: eq(brandSettings.organizationId, organizationId),
      });
      if (!settings) {
        throw new Error(
          "No brand settings exist for this organization; cannot save brand colors"
        );
      }

      return await db.transaction(async (tx) => {
        await tx
          .insert(brandGuidelines)
          .values({
            brandSettingsId: settings.id,
            id: randomUUID(),
            lastGeneratedAt: new Date(),
            status: "ready",
          })
          .onConflictDoNothing({ target: brandGuidelines.brandSettingsId });

        const [guideline] = await tx
          .select({ id: brandGuidelines.id })
          .from(brandGuidelines)
          .where(eq(brandGuidelines.brandSettingsId, settings.id))
          .for("update");
        if (!guideline) {
          throw new Error("Brand guideline row could not be created or found");
        }
        const guidelineId = guideline.id;

        const existingColor = await tx.query.brandGuidelineColors.findFirst({
          columns: { id: true },
          where: eq(brandGuidelineColors.guidelineId, guidelineId),
        });
        if (existingColor) {
          return {
            guidelineId,
            savedCount: 0,
            skipped: true,
            skippedReason:
              "Brand guideline colors already exist for this organization; left them untouched",
          };
        }

        await tx.insert(brandGuidelineColors).values(
          colors.map((color, index) => ({
            darkValue: color.darkValue ?? null,
            guidelineId,
            id: randomUUID(),
            lightValue: color.lightValue,
            name: color.name ?? null,
            role: color.role,
            sortOrder: index,
            usage: color.usage ?? null,
          }))
        );

        return {
          guidelineId,
          savedCount: colors.length,
          skipped: false,
          skippedReason: null,
        };
      });
    },
  });
}
