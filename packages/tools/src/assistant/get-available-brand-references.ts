import { serializeBrandReference } from "@notra/ai/utils/brand-references";
import { defineTool } from "eve/tools";
import { getAvailableBrandReferencesInputSchema } from "../schemas/assistant-tools";
import { getFilteredBrandReferences } from "../utils/brand-references";
import { requireOrganizationId } from "../utils/organization";

export function createGetAvailableBrandReferencesTool() {
  return defineTool({
    description:
      "Lists brand references for a brand identity, defaulting to the organization's default brand identity. Use when the user asks for brand writing examples, tone references, or the source material behind a brand identity.",
    inputSchema: getAvailableBrandReferencesInputSchema,
    async execute({ brandIdentityId, limit }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const { settingsId, references } = await getFilteredBrandReferences({
        organizationId,
        voiceId: brandIdentityId,
      });

      if (!settingsId) {
        return { brandIdentityId: null, references: [], count: 0 };
      }

      const limitedReferences = references.slice(0, limit);

      return {
        brandIdentityId: settingsId,
        references: limitedReferences.map(serializeBrandReference),
        count: limitedReferences.length,
        total: references.length,
      };
    },
  });
}
