import { defineTool } from "eve/tools";
import { getBrandReferencesInputSchema } from "../schemas/assistant-tools";
import { getFilteredBrandReferences } from "../utils/brand-references";
import { requireOrganizationId } from "../utils/organization";
import { getSessionAttribute } from "../utils/session";

export function createGetBrandReferencesTool() {
  return defineTool({
    description:
      "Gets all brand voice references for the organization. Returns real writing samples (tweets, custom text) that define the brand's writing style. ALWAYS call this at the very start before writing any content; these references are the source of truth for how the brand sounds and writes.",
    inputSchema: getBrandReferencesInputSchema,
    async execute(_input, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const { settingsId, references } = await getFilteredBrandReferences({
        organizationId,
        voiceId: getSessionAttribute(ctx, "voiceId") ?? undefined,
        agentType: getSessionAttribute(ctx, "brandAgentType") ?? undefined,
      });

      if (!settingsId) {
        return { references: [], count: 0 };
      }

      return {
        references: references.map((reference) => ({
          type: reference.type,
          content: reference.content,
          note: reference.note,
        })),
        count: references.length,
      };
    },
  });
}
