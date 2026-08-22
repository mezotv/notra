import {
  GEO_CONTEXT_LOOKBACK_DAYS,
  GEO_CONTEXT_MAX_ANSWER_CHARS,
  GEO_CONTEXT_MAX_CHECKS,
  GEO_CONTEXT_MAX_EXCERPT_CHARS,
} from "@notra/ai/constants/geo-writer";
import type { GeoContextToolConfig } from "@notra/ai/types/geo-writer";
import { toolDescription } from "@notra/ai/utils/description";
import { db } from "@notra/db/drizzle";
import {
  geoCompetitors,
  geoMentionChecks,
  geoPrompts,
  geoSettings,
} from "@notra/db/schema";
import { type Tool, tool } from "ai";
import { and, desc, eq, gte } from "drizzle-orm";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";

const MS_PER_DAY = 86_400_000;

const mentionCheckBaseColumns = {
  promptId: geoMentionChecks.promptId,
  engine: geoMentionChecks.engine,
  prompt: geoMentionChecks.prompt,
  mentioned: geoMentionChecks.mentioned,
  position: geoMentionChecks.position,
  sentiment: geoMentionChecks.sentiment,
  competitors: geoMentionChecks.competitors,
  excerpt: geoMentionChecks.excerpt,
  capturedAt: geoMentionChecks.capturedAt,
};

export function createGetGeoContextTool(config: GeoContextToolConfig): Tool {
  return tool({
    description: toolDescription({
      toolName: "getGeoContext",
      intro:
        "Returns the brand's GEO tracking data: the brand name and aliases, tracked competitors, the prompts being monitored, and the latest answer from each AI engine with whether the brand was mentioned.",
      whenToUse:
        "For positioning: to see which questions competitors currently win, how AI assistants describe the category, and which competitor names are fair to mention.",
      usageNotes:
        "Pass includeAnswers=true only if you need the full AI answers instead of short excerpts. Data may be empty for new projects.",
    }),
    inputSchema: z.object({
      includeAnswers: z
        .boolean()
        .default(false)
        .describe("Return the full engine answers instead of excerpts"),
    }),
    execute: async ({ includeAnswers }) => {
      const since = new Date(
        Date.now() - GEO_CONTEXT_LOOKBACK_DAYS * MS_PER_DAY
      );
      const mentionWhere = and(
        eq(geoMentionChecks.projectId, config.projectId),
        eq(geoMentionChecks.organizationId, config.organizationId),
        eq(geoMentionChecks.turn, 0),
        gte(geoMentionChecks.capturedAt, since)
      );
      const mentionOrderBy = [
        geoMentionChecks.promptId,
        geoMentionChecks.engine,
        desc(geoMentionChecks.capturedAt),
      ] as const;

      const [settings, competitors, prompts, checks] = await Promise.all([
        db.query.geoSettings.findFirst({
          columns: { companyName: true, aliases: true },
          where: eq(geoSettings.projectId, config.projectId),
        }),
        db
          .select({
            name: geoCompetitors.name,
            domain: geoCompetitors.domain,
            kind: geoCompetitors.kind,
          })
          .from(geoCompetitors)
          .where(eq(geoCompetitors.projectId, config.projectId)),
        db
          .select({ id: geoPrompts.id, prompt: geoPrompts.prompt })
          .from(geoPrompts)
          .where(
            and(
              eq(geoPrompts.projectId, config.projectId),
              eq(geoPrompts.enabled, true)
            )
          ),
        includeAnswers
          ? db
              .selectDistinctOn(
                [geoMentionChecks.promptId, geoMentionChecks.engine],
                {
                  ...mentionCheckBaseColumns,
                  answer: geoMentionChecks.answer,
                }
              )
              .from(geoMentionChecks)
              .where(mentionWhere)
              .orderBy(...mentionOrderBy)
              .limit(GEO_CONTEXT_MAX_CHECKS)
          : db
              .selectDistinctOn(
                [geoMentionChecks.promptId, geoMentionChecks.engine],
                mentionCheckBaseColumns
              )
              .from(geoMentionChecks)
              .where(mentionWhere)
              .orderBy(...mentionOrderBy)
              .limit(GEO_CONTEXT_MAX_CHECKS),
      ]);

      const latestChecks = checks.map((check) => {
        const base = {
          prompt: check.prompt,
          engine: check.engine,
          mentioned: check.mentioned,
          position: check.position,
          sentiment: check.sentiment,
          competitorsMentioned: check.competitors,
          capturedAt: check.capturedAt.toISOString(),
        };
        if (
          includeAnswers &&
          "answer" in check &&
          typeof check.answer === "string"
        ) {
          return {
            ...base,
            answer: check.answer.slice(0, GEO_CONTEXT_MAX_ANSWER_CHARS),
          };
        }
        return {
          ...base,
          excerpt: check.excerpt.slice(0, GEO_CONTEXT_MAX_EXCERPT_CHARS),
        };
      });

      return {
        brand: {
          name: settings?.companyName ?? null,
          aliases: settings?.aliases ?? [],
        },
        competitors,
        trackedPrompts: prompts.map((prompt) => prompt.prompt),
        latestChecks,
      };
    },
  });
}
