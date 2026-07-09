import { randomUUID } from "node:crypto";
import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";
import { addReferenceInputSchema } from "../lib/schemas/onboarding-tools";
import { requireOrganizationId } from "../lib/utils/organization";

export default defineTool({
  description:
    "Save one strong example of the company's own writing (a tweet, LinkedIn post, blog excerpt, or custom text) as a brand reference on the organization's default brand voice. Use verbatim text from researched sources only.",
  inputSchema: addReferenceInputSchema,
  async execute({ type, content, note, applicableTo, sourceUrl }, ctx) {
    const organizationId = requireOrganizationId(ctx);
    return db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ id: brandSettings.id })
        .from(brandSettings)
        .where(eq(brandSettings.organizationId, organizationId))
        .orderBy(desc(brandSettings.isDefault))
        .limit(1)
        .for("update");
      if (!settings) {
        throw new Error(
          "No brand settings exist for this organization; cannot add a reference"
        );
      }

      const existing = await tx.query.brandReferences.findFirst({
        columns: { id: true },
        where: and(
          eq(brandReferences.brandSettingsId, settings.id),
          eq(brandReferences.type, type),
          eq(brandReferences.content, content)
        ),
      });
      if (existing) {
        return {
          brandSettingsId: settings.id,
          id: existing.id,
          skipped: true,
          type,
        };
      }

      const inserted = await tx
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

      return { brandSettingsId: settings.id, id: row.id, skipped: false, type };
    });
  },
});
