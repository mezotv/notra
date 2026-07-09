import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  brandGuidelineColorRoleEnum,
  brandGuidelineColors,
  brandGuidelines,
  brandSettings,
} from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { MAX_BRAND_COLORS } from "../lib/constants/brand";
import { requireOrganizationId } from "../lib/utils/organization";

export default defineTool({
  description:
    "Save the researched brand colors to the organization's brand guidelines. Skips without overwriting when colors already exist. Use exact color values quoted in the research brief.",
  inputSchema: z.object({
    colors: z
      .array(
        z.object({
          role: z.enum(brandGuidelineColorRoleEnum.enumValues),
          name: z.string().min(1).optional(),
          lightValue: z.string().min(1),
          darkValue: z.string().min(1).optional(),
          usage: z.string().min(1).optional(),
        })
      )
      .min(1)
      .max(MAX_BRAND_COLORS),
  }),
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

    await db
      .insert(brandGuidelines)
      .values({
        brandSettingsId: settings.id,
        id: randomUUID(),
        lastGeneratedAt: new Date(),
        status: "ready",
      })
      .onConflictDoNothing({ target: brandGuidelines.brandSettingsId });

    const guideline = await db.query.brandGuidelines.findFirst({
      columns: { id: true },
      where: eq(brandGuidelines.brandSettingsId, settings.id),
    });
    if (!guideline) {
      throw new Error("Brand guideline row could not be created or found");
    }
    const guidelineId = guideline.id;

    const existingColor = await db.query.brandGuidelineColors.findFirst({
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

    await db.insert(brandGuidelineColors).values(
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
  },
});
