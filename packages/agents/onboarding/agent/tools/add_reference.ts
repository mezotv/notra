import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  applicablePlatformEnum,
  brandReferences,
  brandSettings,
  referenceTypeEnum,
} from "@notra/db/schema";
import { desc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { requireOrganizationId } from "../lib/utils/organization";

export default defineTool({
  description:
    "Save one strong example of the company's own writing (a tweet, LinkedIn post, blog excerpt, or custom text) as a brand reference on the organization's default brand voice. Use verbatim text from researched sources only.",
  inputSchema: z.object({
    type: z.enum(referenceTypeEnum.enumValues),
    content: z.string().min(1),
    note: z.string().min(1).optional(),
    applicableTo: z
      .array(z.enum(applicablePlatformEnum.enumValues))
      .min(1)
      .optional(),
    sourceUrl: z.url().optional(),
  }),
  async execute({ type, content, note, applicableTo, sourceUrl }, ctx) {
    const organizationId = requireOrganizationId(ctx);
    const settings = await db.query.brandSettings.findFirst({
      columns: { id: true },
      orderBy: [desc(brandSettings.isDefault)],
      where: eq(brandSettings.organizationId, organizationId),
    });
    if (!settings) {
      throw new Error(
        "No brand settings exist for this organization; cannot add a reference"
      );
    }

    const inserted = await db
      .insert(brandReferences)
      .values({
        brandSettingsId: settings.id,
        content,
        id: randomUUID(),
        metadata: {
          source: "onboarding-agent",
          ...(sourceUrl ? { sourceUrl } : {}),
        },
        note: note ?? null,
        type,
        ...(applicableTo ? { applicableTo } : {}),
      })
      .returning({ id: brandReferences.id });

    const row = inserted[0];
    if (!row) {
      throw new Error("Brand reference insert returned no row");
    }

    return { brandSettingsId: settings.id, id: row.id, type };
  },
});
