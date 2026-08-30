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
import { geoPromptSuggestions, geoPrompts, projects } from "@notra/db/schema";
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
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Effect } from "effect";

import { assertOrganizationAccess } from "@/lib/auth/organization";
import {
  assertActiveSubscription,
  assertGeoEntitlement,
} from "@/lib/billing/subscription";
import { assertAgentReadinessEnabled } from "@/lib/geo/agent-readiness-access";
import { geoCoreDashboardLayer } from "@/lib/geo/configure";
import { authorizedProcedure } from "@/lib/orpc/base";
import { runOrpcEffect } from "@/lib/orpc/effect";
import { badRequest, notFound } from "@/lib/orpc/utils/errors";
import { toGeoOrpcError } from "@/lib/orpc/utils/geo-errors";
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
>(run: (input: TInput) => Effect.Effect<TOutput, TError, GeoDashboardRuntime>) {
  return async ({
    context,
    input,
  }: GeoHandlerOptions<TInput>): Promise<TOutput> => {
    await assertOrganizationAccess({
      headers: context.headers,
      organizationId: input.organizationId,
      user: context.user,
    });

    return await runOrpcEffect(
      run(input).pipe(Effect.provide(geoCoreDashboardLayer)),
      toGeoOrpcError
    );
  };
}

function geoHandler<
  TInput extends { organizationId: string },
  TOutput,
  TError extends GeoRouterError,
>(run: (input: TInput) => Effect.Effect<TOutput, TError, GeoDashboardRuntime>) {
  return async ({
    context,
    input,
  }: GeoHandlerOptions<TInput>): Promise<TOutput> => {
    await assertGeoAccess({
      headers: context.headers,
      organizationId: input.organizationId,
      user: context.user,
    });

    return await runOrpcEffect(
      run(input).pipe(Effect.provide(geoCoreDashboardLayer)),
      toGeoOrpcError
    );
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
    .handler(geoHandler((input) => upsertGeoSettings(input))),
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
    .input(geoTimeseriesInputSchema)
    .handler(
      geoOpenHandler((input) => loadGeoCompetitorShare(input, geoWindow(input)))
    ),
  competitors: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoOpenHandler((input) => loadGeoCompetitors(input))),
  competitorUpsert: authorizedProcedure
    .input(geoCompetitorUpsertInputSchema)
    .handler(geoOpenHandler((input) => upsertGeoCompetitor(input, input))),
  competitorDelete: authorizedProcedure
    .input(geoCompetitorDeleteInputSchema)
    .handler(geoOpenHandler((input) => deleteGeoCompetitor(input, input.name))),
  competitorsImport: authorizedProcedure
    .input(geoCompetitorsImportInputSchema)
    .handler(
      geoOpenHandler((input) => importGeoCompetitors(input, input.rows))
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
      await assertAgentReadinessEnabled(input.organizationId);
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
        await assertAgentReadinessEnabled(input.organizationId);
        const scope = await runOrpcEffect(
          requireGeoProject(input),
          toGeoOrpcError
        );
        return await runAgentReadinessOrBadRequest(() =>
          Effect.runPromise(
            startAgentReadinessScan(scope).pipe(
              Effect.provide(geoCoreDashboardLayer)
            )
          )
        );
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
      return setup;
    }),
  promptsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => listGeoPrompts(input))),
  promptsCreate: authorizedProcedure
    .input(geoPromptCreateInputSchema)
    .handler(
      geoHandler((input) => createGeoPrompt(input, input.prompt, input.id))
    ),
  promptsImport: authorizedProcedure
    .input(geoPromptsImportInputSchema)
    .handler(geoHandler((input) => importGeoPrompts(input, input.rows))),
  promptsDelete: authorizedProcedure
    .input(geoPromptDeleteInputSchema)
    .handler(geoHandler((input) => deleteGeoPrompt(input, input.promptId))),
  promptsToggle: authorizedProcedure
    .input(geoPromptToggleInputSchema)
    .handler(
      geoHandler((input) =>
        toggleGeoPrompt(input, input.promptId, input.enabled)
      )
    ),
  sequencesList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => listGeoSequences(input))),
  sequencesCreate: authorizedProcedure
    .input(geoSequenceCreateInputSchema)
    .handler(geoHandler((input) => createGeoSequence(input, input))),
  sequencesUpdate: authorizedProcedure
    .input(geoSequenceUpdateInputSchema)
    .handler(geoHandler((input) => updateGeoSequence(input, input))),
  sequencesDelete: authorizedProcedure
    .input(geoSequenceDeleteInputSchema)
    .handler(geoHandler((input) => deleteGeoSequence(input, input.sequenceId))),
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
      if (!rate.success) {
        throw badRequest("Too many runs. Please wait a few minutes.");
      }

      return await runOrpcEffect(
        runGeoSequenceNow(input, input.sequenceId).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
    }),
  projectsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoOpenHandler((input) => listGeoProjects(input.organizationId))),
  projectsCreate: authorizedProcedure
    .input(geoProjectCreateInputSchema)
    .handler(
      geoHandler((input) =>
        createGeoProject(
          input.organizationId,
          input.name,
          input.brandSettingsId
        )
      )
    ),
  generateFromWebsite: authorizedProcedure
    .input(geoGenerateFromWebsiteInputSchema)
    .handler(geoHandler((input) => generateGeoFromWebsite(input, input.url))),
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
  startScan: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => startGeoScan(input))),
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
      if (!rate.success) {
        throw badRequest("Too many briefs. Please wait a few minutes.");
      }

      return await runOrpcEffect(
        planGeoContentBrief(input, context.user?.id).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
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

      return await runOrpcEffect(
        approveAndStartGeoWriter(input, input.briefId).pipe(
          Effect.provide(geoCoreDashboardLayer)
        ),
        toGeoOrpcError
      );
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
        return await runGscSyncOrBadRequest(input.organizationId);
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
      return await db.transaction((tx) =>
        acceptSuggestionInTx(tx, input.organizationId, projectId, suggestion)
      );
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
      return { dismissed: true };
    }),
};
