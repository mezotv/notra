import type { BrandReferencesConfig } from "@notra/ai/types/brand-references";
import { serializeBrandReference } from "@notra/ai/utils/brand-references";
import { toolDescription } from "@notra/ai/utils/description";
import { db } from "@notra/db/drizzle";
import { brandReferences, brandSettings } from "@notra/db/schema";
import {
  getBrandReferenceIdFromSearchResult,
  searchBrandReferenceMemories,
} from "@notra/db/utils/supermemory";
import { type Tool, tool } from "ai";
import { and, desc, eq } from "drizzle-orm";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { getAICachedTools } from "./tool-cache";

type BrandReferenceRecord = Awaited<
  ReturnType<typeof db.query.brandReferences.findMany>
>[number];

async function resolveSettingsId(config: BrandReferencesConfig) {
  if (config.voiceId) {
    const voice = await db.query.brandSettings.findFirst({
      where: and(
        eq(brandSettings.id, config.voiceId),
        eq(brandSettings.organizationId, config.organizationId)
      ),
      columns: { id: true },
    });

    return voice?.id;
  }

  const defaultVoice = await db.query.brandSettings.findFirst({
    where: and(
      eq(brandSettings.organizationId, config.organizationId),
      eq(brandSettings.isDefault, true)
    ),
    columns: { id: true },
  });

  return defaultVoice?.id;
}

async function getFilteredReferences(config: BrandReferencesConfig) {
  const settingsId = await resolveSettingsId(config);

  if (!settingsId) {
    return { settingsId: null, references: [] };
  }

  const refs = await db.query.brandReferences.findMany({
    where: eq(brandReferences.brandSettingsId, settingsId),
    orderBy: [desc(brandReferences.createdAt)],
  });

  const agentType = config.agentType;

  const filtered: BrandReferenceRecord[] = agentType
    ? refs.filter((r: BrandReferenceRecord) => {
        const targets = r.applicableTo as string[];
        return targets.includes("all") || targets.includes(agentType);
      })
    : refs;

  return { settingsId, references: filtered };
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
        const { settingsId, references: filtered } =
          await getFilteredReferences(config);

        if (!settingsId) {
          return { references: [], count: 0 };
        }

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

export function createSearchBrandReferencesTool(
  config: BrandReferencesConfig
): Tool {
  const cached = getAICachedTools({
    organizationId: config.organizationId,
    namespace: "brand",
  });

  return cached(
    tool({
      description: toolDescription({
        toolName: "searchBrandReferences",
        intro:
          "Searches brand voice references semantically and returns the most relevant writing samples for the current content task.",
        whenToUse:
          "Use this first when you need the most relevant brand references for a specific tweet angle, topic, launch, fix, or audience moment.",
        whenNotToUse:
          "Do not use this for factual product or GitHub data. Use GitHub tools for facts. Use getBrandReferences only when you need the full unranked set as fallback.",
        usageNotes:
          "Pass a concise query describing the tweet angle or voice signal you need. The tool uses Supermemory for ranking and falls back to recent references if semantic search is unavailable.",
      }),
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(10).optional().default(5),
      }),
      execute: async ({ query, limit }) => {
        const { settingsId, references } = await getFilteredReferences(config);

        if (!settingsId || references.length === 0) {
          return { references: [], count: 0, source: "empty" };
        }

        try {
          const results = await searchBrandReferenceMemories({
            voiceId: settingsId,
            query,
            applicableTo: config.agentType,
            limit,
          });

          const orderedIds = results
            .map(getBrandReferenceIdFromSearchResult)
            .filter((value): value is string => Boolean(value));

          if (orderedIds.length > 0) {
            const byId = new Map(
              references.map((reference: BrandReferenceRecord) => [
                reference.id,
                reference,
              ])
            );
            const ranked = orderedIds
              .map((id) => byId.get(id))
              .filter((value): value is BrandReferenceRecord => Boolean(value));

            if (ranked.length > 0) {
              return {
                references: ranked.map((r) => ({
                  type: r.type,
                  content: r.content,
                  note: r.note,
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
          references: fallback.map((r) => ({
            type: r.type,
            content: r.content,
            note: r.note,
          })),
          count: fallback.length,
          source: "fallback",
        };
      },
    }),
    {
      ttl: 5 * 60 * 1000,
      keyGenerator: (params) => {
        const { query, limit } = params as { query: string; limit: number };
        return `search_brand_references:org=${config.organizationId}:voice=${config.voiceId ?? "default"}:agent=${config.agentType ?? "all"}:limit=${limit}:query=${query}`;
      },
    }
  );
}

export function createGetAvailableBrandReferencesTool(config: {
  organizationId: string;
}): Tool {
  const cached = getAICachedTools({
    organizationId: config.organizationId,
    namespace: "brand",
  });

  return cached(
    tool({
      description: toolDescription({
        toolName: "getAvailableBrandReferences",
        intro:
          "Lists brand references for a brand identity, defaulting to the organization's default brand identity.",
        whenToUse:
          "Use when the user asks for brand writing examples, tone references, or the source material behind a brand identity.",
        usageNotes:
          "Pass an optional brandIdentityId, or omit it to use the default brand identity. You can also limit the number of returned references.",
      }),
      inputSchema: z.object({
        brandIdentityId: z
          .string()
          .optional()
          .describe(
            "Optional brand identity id. Defaults to the default brand identity."
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .default(10)
          .describe("Maximum number of references to return."),
      }),
      execute: async ({ brandIdentityId, limit }) => {
        const { settingsId, references } = await getFilteredReferences({
          organizationId: config.organizationId,
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
    }),
    {
      ttl: 5 * 60 * 1000,
      keyGenerator: (params) => {
        const { brandIdentityId, limit } = params as {
          brandIdentityId?: string;
          limit: number;
        };
        return `get_available_brand_references:org=${config.organizationId}:voice=${brandIdentityId ?? "default"}:limit=${limit}`;
      },
    }
  );
}
