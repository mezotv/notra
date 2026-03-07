import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, desc, eq } from "drizzle-orm";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { toolDescription } from "@/utils/ai/description";
import { getAICachedTools } from "./tool-cache";

type AgentType = "twitter" | "linkedin" | "blog";

interface BrandReferencesConfig {
  organizationId: string;
  voiceId?: string;
  agentType?: AgentType;
}

export function createGetBrandReferencesTool(
  config: BrandReferencesConfig
): Tool {
  const cached = getAICachedTools({
    organizationId: config.organizationId,
    namespace: "brand",
  });

  return cached(
    tool({
      description: toolDescription({
        toolName: "getBrandReferences",
        intro:
          "Gets all brand voice references for the organization. Returns real writing samples (tweets, custom text) that define the brand's writing style.",
        whenToUse:
          "ALWAYS call this tool at the very start before writing any content. These references are the source of truth for how the brand sounds and writes.",
        usageNotes:
          "Returns an array of references with type (twitter_post or custom), content, and optional notes. Study the tone, vocabulary, sentence structure, and patterns across all references to match the brand voice accurately.",
      }),
      inputSchema: z.object({}),
      execute: async () => {
        const voiceId = config.voiceId;
        let settingsId = voiceId;

        if (!settingsId) {
          const defaultVoice = await db.query.brandSettings.findFirst({
            where: and(
              eq(brandSettings.organizationId, config.organizationId),
              eq(brandSettings.isDefault, true)
            ),
            columns: { id: true },
          });
          settingsId = defaultVoice?.id;
        }

        if (!settingsId) {
          return { references: [], count: 0 };
        }

        const refs = await db.query.brandReferences.findMany({
          where: eq(brandReferences.brandSettingsId, settingsId),
          orderBy: [desc(brandReferences.createdAt)],
          columns: {
            type: true,
            content: true,
            note: true,
            applicableTo: true,
          },
        });

        const agentType = config.agentType;
        const filtered = agentType
          ? refs.filter((r) => {
              const targets = r.applicableTo as string[];
              return targets.includes("all") || targets.includes(agentType);
            })
          : refs;

        return {
          references: filtered.map((r) => ({
            type: r.type,
            content: r.content,
            note: r.note,
          })),
          count: filtered.length,
        };
      },
    }),
    {
      ttl: 5 * 60 * 1000,
      keyGenerator: () =>
        `get_brand_references:org=${config.organizationId}:voice=${config.voiceId ?? "default"}:agent=${config.agentType ?? "all"}`,
    }
  );
}
