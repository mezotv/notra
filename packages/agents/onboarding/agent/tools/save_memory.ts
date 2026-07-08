import { defineTool } from "eve/tools";
// biome-ignore lint/performance/noNamespaceImport: zod v4 recommends the namespace import
import * as z from "zod";
import { MEMORY_SOURCE_TAG } from "../lib/constants/supermemory";
import { supermemoryCreateResponseSchema } from "../lib/schemas/supermemory";
import { requireOrganizationId } from "../lib/utils/organization";
import {
  getOrganizationContainerTag,
  requestSupermemory,
} from "../lib/utils/supermemory";

export default defineTool({
  description:
    "Save one curated, durable fact about the organization to Supermemory: positioning, tone evidence, audience, covered topics, or competitors. Never raw scrapes.",
  inputSchema: z.object({
    content: z.string().min(1),
    topic: z.string().min(1),
  }),
  async execute({ content, topic }, ctx) {
    const organizationId = requireOrganizationId(ctx);
    const response = supermemoryCreateResponseSchema.parse(
      await requestSupermemory("/v4/memories", {
        containerTag: getOrganizationContainerTag(organizationId),
        memories: [
          {
            content,
            metadata: {
              source: MEMORY_SOURCE_TAG,
              organizationId,
              topic,
            },
          },
        ],
      })
    );

    return {
      documentId: response.documentId ?? null,
      memoryId: response.memories?.[0]?.id ?? null,
      topic,
    };
  },
});
