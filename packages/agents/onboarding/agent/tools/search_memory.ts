import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { MEMORY_SEARCH_DEFAULT_LIMIT } from "../lib/constants/supermemory";
import { supermemorySearchResponseSchema } from "../lib/schemas/supermemory";
import {
  getOrganizationContainerTag,
  requestSupermemory,
} from "../lib/utils/supermemory";

export default defineTool({
  description:
    "Search the organization's Supermemory for existing facts before saving new ones or making claims about what is already known.",
  inputSchema: z.object({
    organizationId: z.string().min(1),
    query: z.string().min(1),
    limit: z.number().int().min(1).max(20).default(MEMORY_SEARCH_DEFAULT_LIMIT),
  }),
  async execute({ organizationId, query, limit }) {
    const response = supermemorySearchResponseSchema.parse(
      await requestSupermemory("/v4/search", {
        q: query,
        limit,
        rerank: true,
        containerTag: getOrganizationContainerTag(organizationId),
      })
    );

    return {
      results: response.results.map((result) => ({
        documentId: result.documentId ?? null,
        content:
          result.memory ??
          result.chunks
            ?.map((chunk) => chunk.content)
            .filter(Boolean)
            .join("\n") ??
          null,
        score: result.score ?? null,
      })),
    };
  },
});
