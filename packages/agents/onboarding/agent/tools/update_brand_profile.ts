import { db } from "@notra/db/drizzle";
import { brandSettings } from "@notra/db/schema";
import { desc, eq, type SQL, sql } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { BRAND_PROFILE_FIELDS } from "../lib/constants/brand";
import { updateBrandProfileInputSchema } from "../lib/schemas/onboarding-tools";
import type { BrandProfileField } from "../lib/types/brand";
import { requireOrganizationId } from "../lib/utils/organization";

export default defineTool({
  description:
    "Fill in missing fields on the organization's default brand voice from research findings: company name, description, tone profile, and audience. Never overwrites fields the user already filled in.",
  inputSchema: updateBrandProfileInputSchema,
  async execute(fields, ctx) {
    const organizationId = requireOrganizationId(ctx);
    const settings = await db.query.brandSettings.findFirst({
      columns: {
        audience: true,
        companyDescription: true,
        companyName: true,
        id: true,
        toneProfile: true,
      },
      orderBy: [desc(brandSettings.isDefault)],
      where: eq(brandSettings.organizationId, organizationId),
    });
    if (!settings) {
      throw new Error(
        "No brand settings exist for this organization; cannot update the brand profile"
      );
    }

    const columns = {
      audience: brandSettings.audience,
      companyDescription: brandSettings.companyDescription,
      companyName: brandSettings.companyName,
      toneProfile: brandSettings.toneProfile,
    } as const;

    const updatedFields: BrandProfileField[] = [];
    const skippedFields: BrandProfileField[] = [];
    const patch: Partial<Record<BrandProfileField, SQL>> = {};

    for (const field of BRAND_PROFILE_FIELDS) {
      const value = fields[field];
      if (value === undefined) {
        continue;
      }
      const current = settings[field];
      if (current && current.trim().length > 0) {
        skippedFields.push(field);
        continue;
      }
      patch[field] =
        sql`COALESCE(NULLIF(TRIM(${columns[field]}), ''), ${value})`;
      updatedFields.push(field);
    }

    if (updatedFields.length > 0) {
      await db
        .update(brandSettings)
        .set(patch)
        .where(eq(brandSettings.id, settings.id));
    }

    return { skippedFields, updatedFields };
  },
});
