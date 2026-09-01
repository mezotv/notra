import {
  deleteGscIntegration,
  GscApiError,
  GscReauthRequiredError,
  getGscIntegration,
  getGscOAuthCredentials,
  listGscSites,
  revokeGscToken,
  updateGscIntegration,
} from "@notra/ai/integrations/google-search-console";
import {
  createQstashRouteSchedule,
  deleteQstashSchedule,
} from "@notra/ai/qstash/triggers";
import { db } from "@notra/db/drizzle";
import {
  geoAgentReadinessReports,
  geoPromptSuggestions,
  geoPrompts,
  projects,
} from "@notra/db/schema";
import { GEO_SAMPLE_DATA_ENABLED } from "@notra/geo-core/constants/geo";
import {
  GSC_SCHEDULE_ID_PREFIX,
  GSC_SYNC_CRON,
  GSC_SYNC_WORKFLOW_PATH,
} from "@notra/geo-core/constants/google-search-console";
import {
  AgentReadinessApiError,
  AgentReadinessTargetMissingError,
  loadAgentReadiness,
  startAgentReadinessScan,
} from "@notra/geo-core/geo/agent-readiness";
import {
  discoverGeoWebsite,
  generateGeoFromWebsite,
} from "@notra/geo-core/geo/discover";
import type { GeoRouterError } from "@notra/geo-core/geo/errors";
import { loadGeoContentGaps } from "@notra/geo-core/geo/gaps";
import {
  issueGeoIngestSetupResponse,
  rotateGeoIngestSetupResponse,
} from "@notra/geo-core/geo/ingest";
import { lockGeoProject } from "@notra/geo-core/geo/lock";
import { toTrackedPrompt } from "@notra/geo-core/geo/mappers";
import { loadGeoModelCatalog } from "@notra/geo-core/geo/model-catalog";
import {
  saveGeoOnboardingBrand,
  searchGeoBrands,
  suggestGeoCompetitors,
} from "@notra/geo-core/geo/onboarding";
import {
  createGeoPrompt,
  deleteGeoCompetitor,
  deleteGeoPrompt,
  importGeoCompetitors,
  importGeoPrompts,
  listGeoPrompts,
  loadAiTraffic,
  loadGeoCompetitorDetail,
  loadGeoCompetitorShare,
  loadGeoCompetitors,
  loadGeoJourneyDetail,
  loadGeoLanguageShare,
  loadGeoOverview,
  loadGeoPromptResults,
  loadGeoSettings,
  loadGeoTimeseries,
  loadGeoTrafficJourneys,
  loadGeoTrafficLog,
  loadGeoTrafficPages,
  startGeoScan,
  toggleGeoPrompt,
  upsertGeoCompetitor,
  upsertGeoSettings,
} from "@notra/geo-core/geo/programs";
import {
  createGeoProject,
  listGeoProjects,
  requireGeoProject,
} from "@notra/geo-core/geo/projects";
import { promptKey } from "@notra/geo-core/geo/prompt-key";
import {
  clearGeoSampleData,
  seedGeoSampleData,
} from "@notra/geo-core/geo/sample-data";
import { runGeoSequenceNow } from "@notra/geo-core/geo/scan";
import { syncGscSuggestions } from "@notra/geo-core/geo/search-console";
import {
  createGeoSequence,
  deleteGeoSequence,
  listGeoSequences,
  loadGeoSequenceResults,
  updateGeoSequence,
} from "@notra/geo-core/geo/sequences";
import { geoWindow } from "@notra/geo-core/geo/window";
import {
  approveAndStartGeoWriter,
  getGeoContentBrief,
  listGeoContentBriefs,
  planGeoContentBrief,
} from "@notra/geo-core/geo/writer";
import {
  aiTrafficInputSchema,
  geoBrandSearchInputSchema,
  geoCompetitorDeleteInputSchema,
  geoCompetitorShareInputSchema,
  geoCompetitorsImportInputSchema,
  geoCompetitorDetailInputSchema,
  geoCompetitorSuggestionsInputSchema,
  geoCompetitorUpsertInputSchema,
  geoGenerateFromWebsiteInputSchema,
  geoJourneyDetailInputSchema,
  geoModelCatalogInputSchema,
  geoOnboardingBrandInputSchema,
  geoOrganizationInputSchema,
  geoProjectCreateInputSchema,
  geoPromptCreateInputSchema,
  geoPromptsImportInputSchema,
  geoPromptDeleteInputSchema,
  geoPromptToggleInputSchema,
  geoSequenceCreateInputSchema,
  geoSequenceDeleteInputSchema,
  geoSequenceResultsInputSchema,
  geoSequenceRunInputSchema,
  geoSequenceUpdateInputSchema,
  geoSettingsUpsertInputSchema,
  geoSuggestionIdInputSchema,
  geoTimeseriesInputSchema,
  geoTrafficJourneysInputSchema,
  geoTrafficLogInputSchema,
  geoTrafficPagesInputSchema,
  geoWriterBriefIdInputSchema,
  geoWriterPlanInputSchema,
} from "@notra/geo-core/schemas/geo";
import { gscSelectSiteInputSchema } from "@notra/geo-core/schemas/google-search-console";
import type {
  AgentReadinessResponse,
  AgentReadinessScanResponse,
} from "@notra/geo-core/types/agent-readiness";
import type { DbTransaction } from "@notra/geo-core/types/db";
import type {
  GeoIngestSetupResponse,
  GeoTrackedPrompt,
} from "@notra/geo-core/types/geo";
import type {
  GeoSearchConsoleStatus,
  GscSitesResponse,
  GscSyncResult,
} from "@notra/geo-core/types/google-search-console";
import { POSTHOG_EVENTS } from "@notra/posthog/events";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Effect } from "effect";

import {
  GEO_COMPETITOR_SOURCES,
  GEO_DEFAULT_SCAN_TRIGGER,
  GEO_PROMPT_SOURCES,
  GEO_SEQUENCE_RUN_OUTCOMES,
} from "@/constants/geo-analytics";
import {
  countGeoProjects,
  loadGeoScanStartSnapshot,
  summarizeSuggestionKeywords,
  trackGeoRouterEvent,
} from "@/lib/analytics/geo-server-events";
import { identifyProjectGroup } from "@/lib/analytics/posthog-server";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import {
  assertActiveSubscription,
  assertGeoEntitlement,
} from "@/lib/billing/subscription";
import { geoCoreDashboardLayer } from "@/lib/geo/configure";
import { authorizedProcedure } from "@/lib/orpc/base";
import { runOrpcEffect } from "@/lib/orpc/effect";
import { badRequest, notFound } from "@/lib/orpc/utils/errors";
import { toGeoOrpcError } from "@/lib/orpc/utils/geo-errors";
import { geoScanStartInputSchema } from "@/schemas/geo-analytics";
import type { GeoHandlerTracker } from "@/types/analytics/geo-events";
import type { AuthenticatedUser } from "@/types/auth/organization";
import type {
  GeoBrandSearchHandlerInput,
  GeoCompetitorSuggestionsHandlerInput,
  GeoPromptSuggestion,
  GeoPromptSuggestionRow,
  GeoPromptSuggestionsResponse,
} from "@/types/geo";
import type { GeoDashboardRuntime } from "@/types/geo-runtime";
import { ratelimit } from "@/utils/ratelimit";

interface GeoHandlerOptions<TInput> {
  context: { headers: Headers; user?: AuthenticatedUser };
  input: TInput;
}

async function assertGeoAccess(
  params: Parameters<typeof assertOrganizationAccess>[0]
): Promise<void> {
  await assertOrganizationAccess(params);
  await assertGeoEntitlement(params.organizationId);
}

function geoOpenHandler<
  TInput extends { organizationId: string },
  TOutput,
  TError extends GeoRouterError,
>(
  run: (input: TInput) => Effect.Effect<TOutput, TError, GeoDashboardRuntime>,
  track?: GeoHandlerTracker<TInput, TOutput>
) {
  return async ({
    context,
    input,
  }: GeoHandlerOptions<TInput>): Promise<TOutput> => {
    await assertOrganizationAccess({
      headers: context.headers,
      organizationId: input.organizationId,
      user: context.user,
    });

    const output = await runOrpcEffect(
      run(input).pipe(Effect.provide(geoCoreDashboardLayer)),
      toGeoOrpcError
    );
    await track?.({ context, input, output });
    return output;
  };
}

function geoHandler<
  TInput extends { organizationId: string },
  TOutput,
  TError extends GeoRouterError,
>(
  run: (input: TInput) => Effect.Effect<TOutput, TError, GeoDashboardRuntime>,
  track?: GeoHandlerTracker<TInput, TOutput>
) {
  return async ({
    context,
    input,
  }: GeoHandlerOptions<TInput>): Promise<TOutput> => {
    await assertGeoAccess({
      headers: context.headers,
      organizationId: input.organizationId,
      user: context.user,
    });

    const output = await runOrpcEffect(
      run(input).pipe(Effect.provide(geoCoreDashboardLayer)),
      toGeoOrpcError
    );
    await track?.({ context, input, output });
    return output;
  };
}

function toPromptSuggestion(row: GeoPromptSuggestionRow): GeoPromptSuggestion {
  return {
    id: row.id,
    prompt: row.prompt,
    source: row.source,
    keywords: row.sourceKeywords,
    createdAt: row.createdAt.toISOString(),
  };
}

function toGscErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof GscReauthRequiredError) {
    return "Google Search Console access expired. Please reconnect.";
  }
  // GscApiError messages are curated in the integration layer; anything else
  // (AI SDK, driver, ...) would leak internals into a user-facing toast.
  if (error instanceof GscApiError) {
    return error.message || fallback;
  }
  return fallback;
}

async function runAgentReadinessOrBadRequest<T>(
  run: () => Promise<T>
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (
      error instanceof AgentReadinessTargetMissingError ||
      error instanceof AgentReadinessApiError
    ) {
      throw badRequest(error.message);
    }
    throw error;
  }
}

async function runGscSyncOrBadRequest(
  organizationId: string
): Promise<GscSyncResult> {
  try {
    return await syncGscSuggestions(organizationId);
  } catch (error) {
    throw badRequest(
      toGscErrorMessage(error, "Failed to sync Search Console keywords")
    );
  }
}

async function ensureGscSchedule(
  organizationId: string,
  existingScheduleId: string | null
): Promise<string | null> {
  if (existingScheduleId) {
    return existingScheduleId;
  }
  try {
    // Deterministic id: a retry (or a row that never recorded the id) reuses the
    // same schedule instead of leaving an orphan firing every week.
    return await createQstashRouteSchedule({
      path: GSC_SYNC_WORKFLOW_PATH,
      cron: GSC_SYNC_CRON,
      body: { organizationId },
      scheduleId: `${GSC_SCHEDULE_ID_PREFIX}${organizationId}`,
    });
  } catch (error) {
    console.error("[GSC] Failed to create weekly sync schedule:", error);
    return null;
  }
}

async function removeGscSchedule(scheduleId: string | null) {
  if (!scheduleId) {
    return;
  }
  try {
    await deleteQstashSchedule(scheduleId);
  } catch (error) {
    console.error("[GSC] Failed to delete QStash schedule:", error);
  }
}

async function requireDefaultProjectId(
  organizationId: string
): Promise<string> {
  const row = await db.query.projects.findFirst({
    columns: { id: true },
    where: eq(projects.organizationId, organizationId),
    orderBy: [asc(projects.createdAt)],
  });
  if (!row) {
    throw badRequest("Configure your brand tracking settings first");
  }
  return row.id;
}

async function acceptSuggestionInTx(
  tx: DbTransaction,
  organizationId: string,
  projectId: string,
  suggestion: Pick<GeoPromptSuggestionRow, "id" | "prompt" | "title">
): Promise<GeoTrackedPrompt> {
  await Effect.runPromise(lockGeoProject(tx, projectId));
  // Reuse an identical tracked prompt instead of creating a duplicate.
  const existing = await tx.query.geoPrompts.findFirst({
    where: and(
      eq(geoPrompts.organizationId, organizationId),
      eq(geoPrompts.projectId, projectId),
      sql`lower(trim(${geoPrompts.prompt})) = ${promptKey(suggestion.prompt)}`
    ),
  });
  const promptRow =
    existing ??
    (
      await tx
        .insert(geoPrompts)
        .values({
          id: crypto.randomUUID(),
          organizationId,
          projectId,
          prompt: suggestion.prompt,
          title: suggestion.title,
        })
        .returning()
    )[0];
  if (!promptRow) {
    throw badRequest("Failed to create prompt");
  }
  await tx
    .update(geoPromptSuggestions)
    .set({ status: "accepted", acceptedPromptId: promptRow.id })
    .where(eq(geoPromptSuggestions.id, suggestion.id));
  return toTrackedPrompt(promptRow);
}
export const geoRouter = {
  modelCatalog: authorizedProcedure
    .input(geoModelCatalogInputSchema)
    .handler(({ input }) =>
      Effect.runPromise(
        loadGeoModelCatalog(input.organizationId).pipe(
          Effect.provide(geoCoreDashboardLayer)
        )
      )
    ),
  settings: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoOpenHandler((input) => loadGeoSettings(input))),
  settingsUpsert: authorizedProcedure
    .input(geoSettingsUpsertInputSchema)
    .handler(
      geoHandler(
        (input) => upsertGeoSettings(input),
        ({ context, input, output }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_SETTINGS_SAVED,
            projectId: output.settings?.projectId,
            properties: {
              engine_count: input.engines.length,
              language_count: input.languages.length,
              alias_count: input.aliases.length,
              schedule_enabled: input.enabled,
              interval_hours: input.scanIntervalHours,
              enforce_zdr: output.settings?.enforceZdr ?? input.enforceZdr,
              non_zdr_approved_count: input.nonZdrApprovedEngines.length,
            },
          });
        }
      )
    ),
  languageShare: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(
      geoHandler((input) => loadGeoLanguageShare(input, geoWindow(input)))
    ),
  overview: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(geoHandler((input) => loadGeoOverview(input, geoWindow(input)))),
  timeseries: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(geoHandler((input) => loadGeoTimeseries(input, geoWindow(input)))),
  promptResults: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(
      geoHandler((input) => loadGeoPromptResults(input, geoWindow(input)))
    ),
  competitorShare: authorizedProcedure
    .input(geoCompetitorShareInputSchema)
    .handler(
      geoOpenHandler((input) =>
        loadGeoCompetitorShare(input, geoWindow(input), input.summaryOnly)
      )
    ),
  competitors: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoOpenHandler((input) => loadGeoCompetitors(input))),
  competitorUpsert: authorizedProcedure
    .input(geoCompetitorUpsertInputSchema)
    .handler(
      geoOpenHandler(
        (input) => upsertGeoCompetitor(input, input),
        ({ context, input, output }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: input.previousName
              ? POSTHOG_EVENTS.GEO_COMPETITOR_UPDATED
              : POSTHOG_EVENTS.GEO_COMPETITOR_ADDED,
            properties: {
              kind: input.kind ?? null,
              source: GEO_COMPETITOR_SOURCES.MANUAL,
              has_domain: input.domain !== null,
              synonym_count: input.synonyms?.length ?? 0,
              competitor_count: output.competitors.length,
            },
          });
        }
      )
    ),
  competitorDelete: authorizedProcedure
    .input(geoCompetitorDeleteInputSchema)
    .handler(
      geoOpenHandler(
        (input) => deleteGeoCompetitor(input, input.name),
        ({ context, input, output }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_COMPETITOR_DELETED,
            properties: { competitor_count: output.competitors.length },
          });
        }
      )
    ),
  competitorsImport: authorizedProcedure
    .input(geoCompetitorsImportInputSchema)
    .handler(
      geoOpenHandler(
        (input) => importGeoCompetitors(input, input.rows),
        ({ context, input, output }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_COMPETITORS_IMPORTED,
            properties: {
              rows: input.rows.length,
              inserted: output.imported,
              updated: output.updated,
              duplicates: output.skipped,
              competitor_count: output.competitors.length,
            },
          });
        }
      )
    ),
  competitorDetail: authorizedProcedure
    .input(geoCompetitorDetailInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoCompetitorDetail(input, input.brand, geoWindow(input))
      )
    ),
  agentReadiness: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<AgentReadinessResponse> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });
      const scope = await runOrpcEffect(
        requireGeoProject(input),
        toGeoOrpcError
      );
      return await runAgentReadinessOrBadRequest(() =>
        loadAgentReadiness(scope)
      );
    }),
  agentReadinessScan: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(
      async ({ context, input }): Promise<AgentReadinessScanResponse> => {
        await assertGeoAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });
        const scope = await runOrpcEffect(
          requireGeoProject(input),
          toGeoOrpcError
        );
        const [response, previousReport] = await Promise.all([
          runAgentReadinessOrBadRequest(() =>
            Effect.runPromise(
              startAgentReadinessScan(scope).pipe(
                Effect.provide(geoCoreDashboardLayer)
              )
            )
          ),
          db.query.geoAgentReadinessReports
            .findFirst({
              columns: { id: true },
              where: and(
                eq(geoAgentReadinessReports.projectId, scope.projectId),
                eq(geoAgentReadinessReports.status, "completed")
              ),
            })
            .catch(() => undefined),
        ]);
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.AGENT_READINESS_SCAN_STARTED,
          projectId: scope.projectId,
          properties: {
            report_id: response.reportId,
            is_rescan: previousReport !== undefined && previousReport !== null,
            already_running: response.alreadyRunning,
          },
        });
        return response;
      }
    ),
  aiTraffic: authorizedProcedure
    .input(aiTrafficInputSchema)
    .handler(geoHandler((input) => loadAiTraffic(input, geoWindow(input)))),
  trafficLog: authorizedProcedure
    .input(geoTrafficLogInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoTrafficLog(
          input,
          input.limit,
          input.visitorTypes,
          input.categories
        )
      )
    ),
  trafficJourneys: authorizedProcedure
    .input(geoTrafficJourneysInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoTrafficJourneys(input, geoWindow(input), input.limit)
      )
    ),
  journeyDetail: authorizedProcedure
    .input(geoJourneyDetailInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoJourneyDetail(input, input.journeyId, geoWindow(input))
      )
    ),
  trafficPages: authorizedProcedure
    .input(geoTrafficPagesInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoTrafficPages(
          input,
          geoWindow(input),
          input.limit,
          input.visitorType
        )
      )
    ),
  ingestSetup: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoIngestSetupResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const setup = await runOrpcEffect(
        issueGeoIngestSetupResponse(input).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
      if (!setup) {
        throw notFound("Organization not found");
      }
      return setup;
    }),
  ingestTokenRotate: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoIngestSetupResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const setup = await runOrpcEffect(
        rotateGeoIngestSetupResponse(input).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
      if (!setup) {
        throw notFound("Organization not found");
      }
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.TRAFFIC_TOKEN_ROTATED,
      });
      return setup;
    }),
  promptsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => listGeoPrompts(input))),
  promptsCreate: authorizedProcedure.input(geoPromptCreateInputSchema).handler(
    geoHandler(
      (input) => createGeoPrompt(input, input.prompt, input.id),
      ({ context, input, output }) => {
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GEO_PROMPT_ADDED,
          properties: {
            source: GEO_PROMPT_SOURCES.MANUAL,
            prompt_id: output.id,
          },
        });
      }
    )
  ),
  promptsImport: authorizedProcedure.input(geoPromptsImportInputSchema).handler(
    geoHandler(
      (input) => importGeoPrompts(input, input.rows),
      ({ context, input, output }) => {
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GEO_PROMPTS_IMPORTED,
          properties: {
            rows: input.rows.length,
            inserted: output.imported,
            duplicates: output.skipped,
          },
        });
      }
    )
  ),
  promptsDelete: authorizedProcedure.input(geoPromptDeleteInputSchema).handler(
    geoHandler(
      (input) => deleteGeoPrompt(input, input.promptId),
      ({ context, input }) => {
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GEO_PROMPT_DELETED,
          properties: { count: 1, prompt_id: input.promptId },
        });
      }
    )
  ),
  promptsToggle: authorizedProcedure.input(geoPromptToggleInputSchema).handler(
    geoHandler(
      (input) => toggleGeoPrompt(input, input.promptId, input.enabled),
      ({ context, input }) => {
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GEO_PROMPT_TOGGLED,
          properties: { enabled: input.enabled, prompt_id: input.promptId },
        });
      }
    )
  ),
  sequencesList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => listGeoSequences(input))),
  sequencesCreate: authorizedProcedure
    .input(geoSequenceCreateInputSchema)
    .handler(
      geoHandler(
        (input) => createGeoSequence(input, input),
        ({ context, input }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_CONVERSATION_CREATED,
            properties: { turn_count: input.steps.length },
          });
        }
      )
    ),
  sequencesUpdate: authorizedProcedure
    .input(geoSequenceUpdateInputSchema)
    .handler(
      geoHandler(
        (input) => updateGeoSequence(input, input),
        ({ context, input }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_CONVERSATION_UPDATED,
            properties: {
              sequence_id: input.sequenceId,
              turn_count: input.steps?.length ?? null,
              enabled: input.enabled ?? null,
            },
          });
        }
      )
    ),
  sequencesDelete: authorizedProcedure
    .input(geoSequenceDeleteInputSchema)
    .handler(
      geoHandler(
        (input) => deleteGeoSequence(input, input.sequenceId),
        ({ context, input }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_CONVERSATION_DELETED,
            properties: { sequence_id: input.sequenceId },
          });
        }
      )
    ),
  sequenceResults: authorizedProcedure
    .input(geoSequenceResultsInputSchema)
    .handler(
      geoHandler((input) => loadGeoSequenceResults(input, input.sequenceId))
    ),
  sequenceRun: authorizedProcedure
    .input(geoSequenceRunInputSchema)
    .handler(async ({ context, input }) => {
      const [, , rate] = await Promise.all([
        assertGeoAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        }),
        assertActiveSubscription(input.organizationId),
        ratelimit.geoSequenceRun.limit(input.organizationId),
      ]);
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_CONVERSATION_RUN_NOW,
        properties: {
          sequence_id: input.sequenceId,
          rate_limited: !rate.success,
        },
      });
      if (!rate.success) {
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GEO_SEQUENCE_RUN,
          properties: {
            sequence_id: input.sequenceId,
            outcome: GEO_SEQUENCE_RUN_OUTCOMES.RATE_LIMITED,
            rate_limited: true,
          },
        });
        throw badRequest("Too many runs. Please wait a few minutes.");
      }

      const result = await runOrpcEffect(
        runGeoSequenceNow(input, input.sequenceId).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_SEQUENCE_RUN,
        properties: {
          sequence_id: input.sequenceId,
          outcome: GEO_SEQUENCE_RUN_OUTCOMES.COMPLETED,
          rate_limited: false,
          checks: result.checks,
          mentions: result.mentions,
          engine_count: result.engines.length,
        },
      });
      return result;
    }),
  projectsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoOpenHandler((input) => listGeoProjects(input.organizationId))),
  projectsCreate: authorizedProcedure
    .input(geoProjectCreateInputSchema)
    .handler(
      geoHandler(
        (input) =>
          createGeoProject(
            input.organizationId,
            input.name,
            input.brandSettingsId
          ),
        async ({ context, input, output }) => {
          const projectCount = await countGeoProjects(
            input.organizationId
          ).catch(() => null);
          identifyProjectGroup({
            projectId: output.id,
            organizationId: input.organizationId,
            userId: context.user?.id ?? null,
            properties: {
              name: output.name,
              is_sample: false,
              brand_settings_id: output.brandSettingsId,
              created_at: output.createdAt,
            },
          });
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_PROJECT_CREATED,
            projectId: output.id,
            properties: { is_sample: false, project_count: projectCount },
          });
        }
      )
    ),
  generateFromWebsite: authorizedProcedure
    .input(geoGenerateFromWebsiteInputSchema)
    .handler(
      geoHandler(
        (input) => generateGeoFromWebsite(input, input.url),
        ({ context, input, output }) => {
          trackGeoRouterEvent({
            context,
            input,
            event: POSTHOG_EVENTS.GEO_PROMPTS_GENERATED_FROM_WEBSITE,
            properties: {
              prompt_count: output.promptsAdded,
              competitor_count: output.competitors.length,
              alias_count: output.aliases.length,
            },
          });
        }
      )
    ),
  discoverWebsite: authorizedProcedure
    .input(geoGenerateFromWebsiteInputSchema)
    .handler(
      geoOpenHandler((input) =>
        discoverGeoWebsite(input.organizationId, input.url)
      )
    ),
  onboardingBrand: authorizedProcedure
    .input(geoOnboardingBrandInputSchema)
    .handler(geoOpenHandler((input) => saveGeoOnboardingBrand(input))),
  competitorSuggestions: authorizedProcedure
    .input(geoCompetitorSuggestionsInputSchema)
    .handler(async (options) => {
      const rate = await ratelimit.geoCompetitorSuggestions.limit(
        options.input.organizationId
      );
      if (!rate.success) {
        throw badRequest("Too many lookups. Please wait a minute.");
      }
      return geoOpenHandler((input: GeoCompetitorSuggestionsHandlerInput) =>
        suggestGeoCompetitors(input, input.domain)
      )(options);
    }),
  brandSearch: authorizedProcedure
    .input(geoBrandSearchInputSchema)
    .handler(async (options) => {
      const rate = await ratelimit.geoBrandSearch.limit(
        options.input.organizationId
      );
      if (!rate.success) {
        throw badRequest("Too many searches. Please wait a minute.");
      }
      return geoOpenHandler((input: GeoBrandSearchHandlerInput) =>
        searchGeoBrands(input, input.query)
      )(options);
    }),
  startScan: authorizedProcedure.input(geoScanStartInputSchema).handler(
    geoHandler(
      (input) => startGeoScan(input),
      async ({ context, input, output }) => {
        const snapshot = await loadGeoScanStartSnapshot(input);
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GEO_SCAN_STARTED,
          projectId: snapshot?.projectId,
          properties: {
            trigger: input.trigger ?? GEO_DEFAULT_SCAN_TRIGGER,
            scan_id: output.scanId,
            prompt_count: snapshot?.prompt_count,
            engine_count: snapshot?.engine_count,
            language_count: snapshot?.language_count,
            is_first_scan: snapshot?.is_first_scan,
            zdr_enforced: snapshot?.zdr_enforced,
          },
        });
      }
    )
  ),
  writerGaps: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => loadGeoContentGaps(input))),
  writerBriefsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => listGeoContentBriefs(input))),
  writerBrief: authorizedProcedure
    .input(geoWriterBriefIdInputSchema)
    .handler(geoHandler((input) => getGeoContentBrief(input, input.briefId))),
  writerPlan: authorizedProcedure
    .input(geoWriterPlanInputSchema)
    .handler(async ({ context, input }) => {
      const [, , rate] = await Promise.all([
        assertGeoAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        }),
        assertActiveSubscription(input.organizationId),
        ratelimit.geoWriterPlan.limit(input.organizationId),
      ]);
      const briefTraits = {
        auto_approve: input.autoApprove,
        subtype: input.contentSubtype ?? null,
        source_kind: input.sourceKind ?? "manual",
        competitor_count: input.competitorIds?.length ?? 0,
        has_sitemap: Boolean(input.sitemapId),
        brand_voice_count: input.brandVoiceIds?.length ?? 0,
      };
      if (!rate.success) {
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GEO_BRIEF_PLANNED,
          properties: { ...briefTraits, rate_limited: true },
        });
        throw badRequest("Too many briefs. Please wait a few minutes.");
      }

      const plan = await runOrpcEffect(
        planGeoContentBrief(input, context.user?.id).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_BRIEF_PLANNED,
        properties: {
          ...briefTraits,
          rate_limited: false,
          brief_id: plan.briefId,
          brief_status: plan.status,
          has_post: plan.postId !== null,
        },
      });
      return plan;
    }),
  writerStart: authorizedProcedure
    .input(geoWriterBriefIdInputSchema)
    .handler(async ({ context, input }) => {
      await Promise.all([
        assertGeoAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        }),
        assertActiveSubscription(input.organizationId),
      ]);

      const started = await runOrpcEffect(
        approveAndStartGeoWriter(input, input.briefId).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_WRITER_STARTED,
        properties: { brief_id: input.briefId, run_id: started.runId },
      });
      return started;
    }),
  sampleData: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async (options) => {
      if (!GEO_SAMPLE_DATA_ENABLED) {
        throw notFound();
      }
      return geoHandler((input) => seedGeoSampleData(input))(options);
    }),
  sampleDataClear: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async (options) => {
      if (!GEO_SAMPLE_DATA_ENABLED) {
        throw notFound();
      }
      return geoHandler((input) => clearGeoSampleData(input))(options);
    }),
  searchConsoleStatus: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoSearchConsoleStatus> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const configured = getGscOAuthCredentials() !== null;
      const integration = await getGscIntegration(input.organizationId);
      if (!integration) {
        return {
          configured,
          connected: false,
          email: null,
          siteUrl: null,
          status: null,
          lastSyncedAt: null,
          lastError: null,
          weeklySyncScheduled: false,
          sites: [],
        };
      }

      let sites: GeoSearchConsoleStatus["sites"] = [];
      let lastError = integration.lastError;
      let refreshed = integration;
      if (!integration.siteUrl && integration.status === "active") {
        try {
          sites = await listGscSites(integration);
        } catch (error) {
          console.error("[GSC] Failed to list sites:", error);
          lastError = toGscErrorMessage(
            error,
            "Failed to load Search Console properties"
          );
        }
        // Listing may have refreshed the access token or flipped the row to
        // reauth_required, so re-read only on that path.
        refreshed =
          (await getGscIntegration(input.organizationId)) ?? integration;
      }

      return {
        configured,
        connected: true,
        email: refreshed.googleAccountEmail,
        siteUrl: refreshed.siteUrl,
        status: refreshed.status,
        lastSyncedAt: refreshed.lastSyncedAt?.toISOString() ?? null,
        lastError,
        weeklySyncScheduled: refreshed.qstashScheduleId !== null,
        sites,
      };
    }),
  searchConsoleSites: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GscSitesResponse> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const integration = await getGscIntegration(input.organizationId);
      if (!integration) {
        throw notFound("Google Search Console is not connected");
      }

      try {
        return { sites: await listGscSites(integration) };
      } catch (error) {
        console.error("[GSC] Failed to list sites:", error);
        throw badRequest(
          toGscErrorMessage(error, "Failed to load Search Console properties")
        );
      }
    }),
  searchConsoleSelectSite: authorizedProcedure
    .input(gscSelectSiteInputSchema)
    .handler(async ({ context, input }): Promise<GscSyncResult> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const integration = await getGscIntegration(input.organizationId);
      if (!integration) {
        throw notFound("Google Search Console is not connected");
      }

      let sites: Awaited<ReturnType<typeof listGscSites>>;
      try {
        sites = await listGscSites(integration);
      } catch (error) {
        console.error("[GSC] Failed to verify property:", error);
        throw badRequest(
          toGscErrorMessage(error, "Failed to load Search Console properties")
        );
      }
      if (!sites.some((site) => site.siteUrl === input.siteUrl)) {
        throw badRequest(
          "That property is not available on the connected Google account"
        );
      }

      const scheduleId = await ensureGscSchedule(
        input.organizationId,
        integration.qstashScheduleId
      );

      const updated = await updateGscIntegration(input.organizationId, {
        siteUrl: input.siteUrl,
        qstashScheduleId: scheduleId,
        lastError: null,
      });
      if (!updated) {
        // The row vanished mid-flight; do not leave the schedule behind.
        await removeGscSchedule(scheduleId);
        throw notFound("Google Search Console is not connected");
      }

      try {
        const synced = await runGscSyncOrBadRequest(input.organizationId);
        trackGeoRouterEvent({
          context,
          input,
          event: POSTHOG_EVENTS.GSC_SITE_SELECTED,
          properties: {
            sync_status: synced.status,
            keywords: synced.keywords ?? 0,
            suggestions_created: synced.suggestionsAdded ?? 0,
            weekly_sync_scheduled: scheduleId !== null,
          },
        });
        return synced;
      } catch (error) {
        console.error(
          "[GSC] Initial sync failed after selecting property:",
          error
        );
        try {
          // Keep authentication changes made while refreshing the token, but
          // restore the selection state this request replaced.
          await updateGscIntegration(input.organizationId, {
            siteUrl: integration.siteUrl,
            qstashScheduleId: integration.qstashScheduleId,
            lastError: integration.lastError,
          });
        } catch (rollbackError) {
          console.error(
            "[GSC] Failed to restore integration after initial sync:",
            rollbackError
          );
        }
        if (scheduleId && scheduleId !== integration.qstashScheduleId) {
          await removeGscSchedule(scheduleId);
        }
        throw error;
      }
    }),
  searchConsoleSync: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GscSyncResult> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const { success: withinLimit } = await ratelimit.gscSync.limit(
        input.organizationId
      );
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GSC_SYNC_REQUESTED,
        properties: { rate_limited: !withinLimit },
      });
      if (!withinLimit) {
        throw badRequest("Too many syncs. Please wait a few minutes.");
      }

      const integration = await getGscIntegration(input.organizationId);
      if (!integration) {
        throw notFound("Google Search Console is not connected");
      }
      if (!integration.siteUrl) {
        throw badRequest("Select a Search Console property first");
      }

      if (!integration.qstashScheduleId) {
        // Backfill the weekly schedule if it could not be created earlier.
        const scheduleId = await ensureGscSchedule(input.organizationId, null);
        if (scheduleId) {
          const updated = await updateGscIntegration(input.organizationId, {
            qstashScheduleId: scheduleId,
          });
          if (!updated) {
            await removeGscSchedule(scheduleId);
          }
        }
      }

      return await runGscSyncOrBadRequest(input.organizationId);
    }),
  searchConsoleDisconnect: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<{ disconnected: boolean }> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const integration = await deleteGscIntegration(input.organizationId);
      if (!integration) {
        return { disconnected: false };
      }
      await Promise.all([
        removeGscSchedule(integration.qstashScheduleId),
        revokeGscToken(integration),
      ]);
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GSC_DISCONNECTED,
        properties: {
          had_site: integration.siteUrl !== null,
          had_schedule: integration.qstashScheduleId !== null,
        },
      });
      return { disconnected: true };
    }),
  suggestionsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(
      async ({ context, input }): Promise<GeoPromptSuggestionsResponse> => {
        await assertGeoAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        const rows = await db.query.geoPromptSuggestions.findMany({
          where: and(
            eq(geoPromptSuggestions.organizationId, input.organizationId),
            eq(geoPromptSuggestions.status, "pending")
          ),
          orderBy: [desc(geoPromptSuggestions.createdAt)],
        });

        return { suggestions: rows.map(toPromptSuggestion) };
      }
    ),
  suggestionAccept: authorizedProcedure
    .input(geoSuggestionIdInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrackedPrompt> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const suggestion = await db.query.geoPromptSuggestions.findFirst({
        where: and(
          eq(geoPromptSuggestions.id, input.suggestionId),
          eq(geoPromptSuggestions.organizationId, input.organizationId),
          eq(geoPromptSuggestions.status, "pending")
        ),
      });
      if (!suggestion) {
        throw notFound("Suggestion not found");
      }

      const projectId = await requireDefaultProjectId(input.organizationId);
      const accepted = await db.transaction((tx) =>
        acceptSuggestionInTx(tx, input.organizationId, projectId, suggestion)
      );
      const keywordSummary = summarizeSuggestionKeywords(
        suggestion.sourceKeywords
      );
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_SUGGESTION_ACCEPTED,
        projectId,
        properties: {
          count: 1,
          suggestion_id: suggestion.id,
          impressions: keywordSummary.impressions,
          clicks: keywordSummary.clicks,
          position: keywordSummary.position,
        },
      });
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_PROMPT_ADDED,
        projectId,
        properties: {
          source: GEO_PROMPT_SOURCES.GSC_SUGGESTION,
          prompt_id: accepted.id,
        },
      });
      return accepted;
    }),
  suggestionsAcceptAll: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<{ accepted: number }> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const rows = await db.query.geoPromptSuggestions.findMany({
        where: and(
          eq(geoPromptSuggestions.organizationId, input.organizationId),
          eq(geoPromptSuggestions.status, "pending")
        ),
        orderBy: [asc(geoPromptSuggestions.createdAt)],
      });
      if (rows.length === 0) {
        return { accepted: 0 };
      }

      const projectId = await requireDefaultProjectId(input.organizationId);
      await db.transaction(async (tx) => {
        for (const row of rows) {
          await acceptSuggestionInTx(tx, input.organizationId, projectId, row);
        }
      });
      const keywordSummary = summarizeSuggestionKeywords(
        rows.flatMap((row) => row.sourceKeywords)
      );
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_SUGGESTION_ACCEPTED_ALL,
        projectId,
        properties: {
          count: rows.length,
          impressions: keywordSummary.impressions,
          clicks: keywordSummary.clicks,
          position: keywordSummary.position,
        },
      });
      return { accepted: rows.length };
    }),
  suggestionDismiss: authorizedProcedure
    .input(geoSuggestionIdInputSchema)
    .handler(async ({ context, input }): Promise<{ dismissed: boolean }> => {
      await assertGeoAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      const [row] = await db
        .update(geoPromptSuggestions)
        .set({ status: "dismissed" })
        .where(
          and(
            eq(geoPromptSuggestions.id, input.suggestionId),
            eq(geoPromptSuggestions.organizationId, input.organizationId),
            eq(geoPromptSuggestions.status, "pending")
          )
        )
        .returning({ id: geoPromptSuggestions.id });
      if (!row) {
        throw notFound("Suggestion not found");
      }
      trackGeoRouterEvent({
        context,
        input,
        event: POSTHOG_EVENTS.GEO_SUGGESTION_DISMISSED,
        properties: { count: 1, suggestion_id: row.id },
      });
      return { dismissed: true };
    }),
};
