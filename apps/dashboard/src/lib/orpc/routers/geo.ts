import type { Effect } from "effect";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { generateGeoFromWebsite } from "@/lib/geo/discover";
import type { GeoRouterError } from "@/lib/geo/errors";
import {
  createGeoPrompt,
  deleteGeoCompetitor,
  deleteGeoPrompt,
  listGeoPrompts,
  loadAiTraffic,
  loadGeoCompetitorDetail,
  loadGeoCompetitorShare,
  loadGeoCompetitors,
  loadGeoJourneyDetail,
  loadGeoLanguageShare,
  loadGeoModelUsage,
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
} from "@/lib/geo/programs";
import { createGeoProject, listGeoProjects } from "@/lib/geo/projects";
import {
  createGeoSequence,
  deleteGeoSequence,
  listGeoSequences,
  loadGeoSequenceResults,
  updateGeoSequence,
} from "@/lib/geo/sequences";
import {
  buildGeoAppUrl,
  buildGeoIngestUrl,
  buildGeoSnippet,
} from "@/lib/geo-ingest/snippet";
import { buildGeoIngestToken } from "@/lib/geo-ingest/token";
import { authorizedProcedure } from "@/lib/orpc/base";
import { runOrpcEffect } from "@/lib/orpc/effect";
import { toGeoOrpcError } from "@/lib/orpc/utils/geo-errors";
import {
  aiTrafficInputSchema,
  geoCompetitorDeleteInputSchema,
  geoCompetitorDetailInputSchema,
  geoCompetitorUpsertInputSchema,
  geoGenerateFromWebsiteInputSchema,
  geoJourneyDetailInputSchema,
  geoModelUsageInputSchema,
  geoOrganizationInputSchema,
  geoProjectCreateInputSchema,
  geoPromptCreateInputSchema,
  geoPromptDeleteInputSchema,
  geoPromptToggleInputSchema,
  geoSequenceCreateInputSchema,
  geoSequenceDeleteInputSchema,
  geoSequenceResultsInputSchema,
  geoSequenceUpdateInputSchema,
  geoSettingsUpsertInputSchema,
  geoTimeseriesInputSchema,
  geoTrafficJourneysInputSchema,
  geoTrafficLogInputSchema,
  geoTrafficPagesInputSchema,
} from "@/schemas/geo";
import type { AuthenticatedUser } from "@/types/auth/organization";
import type { GeoIngestSetupResponse } from "@/types/geo";

interface GeoHandlerOptions<TInput> {
  context: { headers: Headers; user?: AuthenticatedUser };
  input: TInput;
}

function geoHandler<
  TInput extends { organizationId: string },
  TOutput,
  TError extends GeoRouterError,
>(run: (input: TInput) => Effect.Effect<TOutput, TError>) {
  return async ({
    context,
    input,
  }: GeoHandlerOptions<TInput>): Promise<TOutput> => {
    await assertOrganizationAccess({
      headers: context.headers,
      organizationId: input.organizationId,
      user: context.user,
    });

    return await runOrpcEffect(run(input), toGeoOrpcError);
  };
}

export const geoRouter = {
  settings: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => loadGeoSettings(input))),
  settingsUpsert: authorizedProcedure
    .input(geoSettingsUpsertInputSchema)
    .handler(geoHandler((input) => upsertGeoSettings(input))),
  languageShare: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(geoHandler((input) => loadGeoLanguageShare(input, input.days))),
  overview: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(geoHandler((input) => loadGeoOverview(input, input.days))),
  timeseries: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(geoHandler((input) => loadGeoTimeseries(input, input.days))),
  promptResults: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => loadGeoPromptResults(input))),
  competitorShare: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(geoHandler((input) => loadGeoCompetitorShare(input, input.days))),
  competitors: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => loadGeoCompetitors(input))),
  competitorUpsert: authorizedProcedure
    .input(geoCompetitorUpsertInputSchema)
    .handler(geoHandler((input) => upsertGeoCompetitor(input, input))),
  competitorDelete: authorizedProcedure
    .input(geoCompetitorDeleteInputSchema)
    .handler(geoHandler((input) => deleteGeoCompetitor(input, input.name))),
  competitorDetail: authorizedProcedure
    .input(geoCompetitorDetailInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoCompetitorDetail(input, input.brand, input.days)
      )
    ),
  modelUsage: authorizedProcedure
    .input(geoModelUsageInputSchema)
    .handler(
      geoHandler((input) => loadGeoModelUsage(input, input.days, input.limit))
    ),
  aiTraffic: authorizedProcedure
    .input(aiTrafficInputSchema)
    .handler(geoHandler((input) => loadAiTraffic(input, input.days))),
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
        loadGeoTrafficJourneys(input, input.days, input.limit)
      )
    ),
  journeyDetail: authorizedProcedure
    .input(geoJourneyDetailInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoJourneyDetail(input, input.journeyId, input.days)
      )
    ),
  trafficPages: authorizedProcedure
    .input(geoTrafficPagesInputSchema)
    .handler(
      geoHandler((input) =>
        loadGeoTrafficPages(input, input.days, input.limit, input.visitorType)
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

      return {
        ingestUrl: buildGeoIngestUrl(),
        token: buildGeoIngestToken(input.organizationId, input.projectId) ?? "",
        snippet: buildGeoSnippet(buildGeoAppUrl()),
      };
    }),
  promptsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => listGeoPrompts(input))),
  promptsCreate: authorizedProcedure
    .input(geoPromptCreateInputSchema)
    .handler(geoHandler((input) => createGeoPrompt(input, input.prompt))),
  promptsDelete: authorizedProcedure
    .input(geoPromptDeleteInputSchema)
    .handler(
      geoHandler((input) =>
        deleteGeoPrompt(input.organizationId, input.promptId)
      )
    ),
  promptsToggle: authorizedProcedure
    .input(geoPromptToggleInputSchema)
    .handler(
      geoHandler((input) =>
        toggleGeoPrompt(input.organizationId, input.promptId, input.enabled)
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
  projectsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => listGeoProjects(input.organizationId))),
  projectsCreate: authorizedProcedure
    .input(geoProjectCreateInputSchema)
    .handler(
      geoHandler((input) => createGeoProject(input.organizationId, input.name))
    ),
  generateFromWebsite: authorizedProcedure
    .input(geoGenerateFromWebsiteInputSchema)
    .handler(geoHandler((input) => generateGeoFromWebsite(input, input.url))),
  startScan: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(geoHandler((input) => startGeoScan(input))),
};
