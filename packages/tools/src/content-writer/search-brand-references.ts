import {
  getBrandReferenceIdFromSearchResult,
  searchBrandReferenceMemories,
} from "@notra/db/utils/supermemory";
import { defineTool } from "eve/tools";

import { searchBrandReferencesInputSchema } from "../schemas/assistant-tools";
import { getFilteredBrandReferences } from "../utils/brand-references";
import { requireOrganizationId } from "../utils/organization";
import { getSessionAttribute } from "../utils/session";

export function createSearchBrandReferencesTool() {
  return defineTool({
    description:
      "Searches brand voice references semantically and returns the most relevant writing samples for the current content task. Pass a concise query describing the angle or voice signal you need. Falls back to recent references if semantic search is unavailable.",
    inputSchema: searchBrandReferencesInputSchema,
    async execute({ query, limit }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const agentType = getSessionAttribute(ctx, "brandAgentType") ?? undefined;
      const { settingsId, references } = await getFilteredBrandReferences({
        organizationId,
        voiceId: getSessionAttribute(ctx, "voiceId") ?? undefined,
        agentType,
      });

      if (!settingsId || references.length === 0) {
        return { references: [], count: 0, source: "empty" };
      }

      try {
        const results = await searchBrandReferenceMemories({
          voiceId: settingsId,
          query,
          applicableTo: agentType,
          limit,
        });

        const orderedIds = results
          .map(getBrandReferenceIdFromSearchResult)
          .filter((value): value is string => Boolean(value));

        if (orderedIds.length > 0) {
          const byId = new Map(
            references.map((reference) => [reference.id, reference])
          );
          const ranked = orderedIds
            .map((id) => byId.get(id))
            .filter((value): value is NonNullable<typeof value> =>
              Boolean(value)
            );

          if (ranked.length > 0) {
            return {
              references: ranked.map((reference) => ({
                type: reference.type,
                content: reference.content,
                note: reference.note,
              })),
              count: ranked.length,
              source: "supermemory",
            };
          }
        }
      } catch {
        // Fall back to recent references below.
      }

      const fallback = references.slice(0, limit);

      return {
        references: fallback.map((reference) => ({
          type: reference.type,
          content: reference.content,
          note: reference.note,
        })),
        count: fallback.length,
        source: "fallback",
      };
    },
  });
}
