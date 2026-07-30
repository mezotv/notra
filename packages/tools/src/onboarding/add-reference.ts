import { defineTool } from "eve/tools";
import { addReferenceInputSchema } from "../schemas/onboarding-tools";
import { requireOrganizationId } from "../utils/organization";
import { addBrandReferences } from "../utils/references";

export function createAddReferenceTool() {
  return defineTool({
    description:
      "Save one strong example of the company's own writing (a tweet, LinkedIn post, blog excerpt, or custom text) as a brand reference on the organization's default brand voice. Use verbatim text from researched sources only.",
    inputSchema: addReferenceInputSchema,
    async execute(reference, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const result = await addBrandReferences(organizationId, [reference]);
      const inserted = result.inserted[0];
      return {
        brandSettingsId: result.brandSettingsId,
        id: inserted?.id ?? null,
        skipped: !inserted,
        type: reference.type,
      };
    },
  });
}
