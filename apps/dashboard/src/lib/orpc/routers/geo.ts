import { assertOrganizationAccess } from "@/lib/auth/organization";
import { generateGeoFromWebsite } from "@/lib/geo/discover";
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
  geoPromptCreateInputSchema,
  geoPromptDeleteInputSchema,
  geoPromptToggleInputSchema,
  geoSettingsUpsertInputSchema,
  geoTimeseriesInputSchema,
  geoTrafficJourneysInputSchema,
  geoTrafficLogInputSchema,
  geoTrafficPagesInputSchema,
} from "@/schemas/geo";
import type {
  AiTrafficResponse,
  GeoCompetitorDetailResponse,
  GeoCompetitorShareResponse,
  GeoCompetitorsResponse,
  GeoGenerateFromWebsiteResult,
  GeoIngestSetupResponse,
  GeoJourneyDetailResponse,
  GeoLanguageShareResponse,
  GeoModelUsageResponse,
  GeoOverviewResponse,
  GeoPromptResultsResponse,
  GeoSettingsResponse,
  GeoTimeseriesResponse,
  GeoTrackedPrompt,
  GeoTrackedPromptsResponse,
  GeoTrafficJourneysResponse,
  GeoTrafficLogResponse,
  GeoTrafficPagesResponse,
} from "@/types/geo";

export const geoRouter = {
  settings: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoSettingsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoSettings(input.organizationId),
        toGeoOrpcError
      );
    }),
  settingsUpsert: authorizedProcedure
    .input(geoSettingsUpsertInputSchema)
    .handler(async ({ context, input }): Promise<GeoSettingsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(upsertGeoSettings(input), toGeoOrpcError);
    }),
  languageShare: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<GeoLanguageShareResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoLanguageShare(input.organizationId, input.days),
        toGeoOrpcError
      );
    }),
  overview: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<GeoOverviewResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoOverview(input.organizationId, input.days),
        toGeoOrpcError
      );
    }),
  timeseries: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(async ({ context, input }): Promise<GeoTimeseriesResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoTimeseries(input.organizationId, input.days),
        toGeoOrpcError
      );
    }),
  promptResults: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoPromptResultsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoPromptResults(input.organizationId),
        toGeoOrpcError
      );
    }),
  competitorShare: authorizedProcedure
    .input(geoTimeseriesInputSchema)
    .handler(
      async ({ context, input }): Promise<GeoCompetitorShareResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return await runOrpcEffect(
          loadGeoCompetitorShare(input.organizationId, input.days),
          toGeoOrpcError
        );
      }
    ),
  competitors: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoCompetitorsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoCompetitors(input.organizationId),
        toGeoOrpcError
      );
    }),
  competitorUpsert: authorizedProcedure
    .input(geoCompetitorUpsertInputSchema)
    .handler(async ({ context, input }): Promise<GeoCompetitorsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        upsertGeoCompetitor(input.organizationId, {
          name: input.name,
          domain: input.domain,
          synonyms: input.synonyms,
          kind: input.kind,
          color: input.color,
        }),
        toGeoOrpcError
      );
    }),
  competitorDelete: authorizedProcedure
    .input(geoCompetitorDeleteInputSchema)
    .handler(async ({ context, input }): Promise<GeoCompetitorsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        deleteGeoCompetitor(input.organizationId, input.name),
        toGeoOrpcError
      );
    }),
  competitorDetail: authorizedProcedure
    .input(geoCompetitorDetailInputSchema)
    .handler(
      async ({ context, input }): Promise<GeoCompetitorDetailResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return await runOrpcEffect(
          loadGeoCompetitorDetail(
            input.organizationId,
            input.brand,
            input.days
          ),
          toGeoOrpcError
        );
      }
    ),
  modelUsage: authorizedProcedure
    .input(geoModelUsageInputSchema)
    .handler(async ({ context, input }): Promise<GeoModelUsageResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoModelUsage(input.organizationId, input.days, input.limit),
        toGeoOrpcError
      );
    }),
  aiTraffic: authorizedProcedure
    .input(aiTrafficInputSchema)
    .handler(async ({ context, input }): Promise<AiTrafficResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadAiTraffic(input.organizationId, input.days),
        toGeoOrpcError
      );
    }),
  trafficLog: authorizedProcedure
    .input(geoTrafficLogInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrafficLogResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoTrafficLog(
          input.organizationId,
          input.limit,
          input.visitorType,
          input.category
        ),
        toGeoOrpcError
      );
    }),
  trafficJourneys: authorizedProcedure
    .input(geoTrafficJourneysInputSchema)
    .handler(
      async ({ context, input }): Promise<GeoTrafficJourneysResponse> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return await runOrpcEffect(
          loadGeoTrafficJourneys(input.organizationId, input.days, input.limit),
          toGeoOrpcError
        );
      }
    ),
  journeyDetail: authorizedProcedure
    .input(geoJourneyDetailInputSchema)
    .handler(async ({ context, input }): Promise<GeoJourneyDetailResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoJourneyDetail(input.organizationId, input.journeyId, input.days),
        toGeoOrpcError
      );
    }),
  trafficPages: authorizedProcedure
    .input(geoTrafficPagesInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrafficPagesResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        loadGeoTrafficPages(
          input.organizationId,
          input.days,
          input.limit,
          input.visitorType
        ),
        toGeoOrpcError
      );
    }),
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
        token: buildGeoIngestToken(input.organizationId) ?? "",
        snippet: buildGeoSnippet(buildGeoAppUrl()),
      };
    }),
  promptsList: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrackedPromptsResponse> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        listGeoPrompts(input.organizationId),
        toGeoOrpcError
      );
    }),
  promptsCreate: authorizedProcedure
    .input(geoPromptCreateInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrackedPrompt> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        createGeoPrompt(input.organizationId, input.prompt),
        toGeoOrpcError
      );
    }),
  promptsDelete: authorizedProcedure
    .input(geoPromptDeleteInputSchema)
    .handler(async ({ context, input }): Promise<{ success: boolean }> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        deleteGeoPrompt(input.organizationId, input.promptId),
        toGeoOrpcError
      );
    }),
  promptsToggle: authorizedProcedure
    .input(geoPromptToggleInputSchema)
    .handler(async ({ context, input }): Promise<GeoTrackedPrompt> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        toggleGeoPrompt(input.organizationId, input.promptId, input.enabled),
        toGeoOrpcError
      );
    }),
  generateFromWebsite: authorizedProcedure
    .input(geoGenerateFromWebsiteInputSchema)
    .handler(
      async ({ context, input }): Promise<GeoGenerateFromWebsiteResult> => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
          user: context.user,
        });

        return await runOrpcEffect(
          generateGeoFromWebsite(input.organizationId, input.url),
          toGeoOrpcError
        );
      }
    ),
  startScan: authorizedProcedure
    .input(geoOrganizationInputSchema)
    .handler(async ({ context, input }): Promise<{ runId: string }> => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
        user: context.user,
      });

      return await runOrpcEffect(
        startGeoScan(input.organizationId),
        toGeoOrpcError
      );
    }),
};
