import { MCP_OAUTH_CALLBACK_PATH } from "@notra/ai/constants/mcp-auth";
import { getGitHubIntegrationsByOrganization } from "@notra/ai/integrations/github";
import { getLinearIntegrationsByOrganization } from "@notra/ai/integrations/linear";
import {
  createMcpStoreListing,
  deleteMcpStoreListing,
  getMcpStoreListing,
  getMcpStoreListingsByOrganization,
  listMcpServerToolsPreview,
  serializeMcpServerIntegration,
  testMcpServerConnection,
  updateMcpStoreListing,
} from "@notra/ai/integrations/mcp";
import { beginMcpOAuthAuthorization } from "@notra/ai/integrations/mcp-oauth";
import { McpOAuthAuthorizationError } from "@notra/ai/integrations/mcp-oauth-errors";
import {
  getMcpIntegrationTools,
  setMcpStoreStatus,
  updateMcpToolActionPhrases,
} from "@notra/ai/integrations/mcp-store";
import { refreshMcpToolIndexForIntegration } from "@notra/ai/integrations/mcp-tool-index";
import { PublicUrlValidationError } from "@notra/utils/url";
import { Effect } from "effect";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { findDisallowedBrandingAssetUrl } from "@/lib/integrations/branding-urls";
import { baseProcedure } from "@/lib/orpc/base";
import {
  beginMcpOAuthScanRequestSchema,
  createMcpServerRequestSchema,
  setMcpServerEnabledRequestSchema,
  submitMcpServerForReviewRequestSchema,
  testMcpServerRequestSchema,
  updateMcpServerRequestSchema,
  updateMcpToolPhrasesRequestSchema,
} from "@/schemas/integrations";
import {
  badRequest,
  conflict,
  internalServerError,
  notFound,
} from "../utils/errors";
import {
  assertRateLimit,
  MCP_CONNECTION_RATE_LIMIT,
} from "../utils/rate-limit";

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

const mcpServerInputSchema = organizationIdInputSchema.extend({
  serverId: z.string().min(1, "MCP server ID is required"),
});

function isUniqueConstraintError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  if ("code" in error && error.code === "23505") {
    return true;
  }
  return "cause" in error && isUniqueConstraintError(error.cause);
}

function getConstraintName(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  if ("constraint" in error && typeof error.constraint === "string") {
    return error.constraint;
  }
  if ("cause" in error) {
    return getConstraintName(error.cause);
  }
  return null;
}

function throwUniqueConstraintConflict(error: unknown): never {
  const constraint = getConstraintName(error);
  if (constraint?.includes("slug")) {
    throw conflict("This slug is already taken");
  }
  throw conflict("An MCP server with this name already exists");
}

export const integrationsRouter = {
  list: baseProcedure
    .input(organizationIdInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const [github, linear, mcpServers] = await Promise.all([
        getGitHubIntegrationsByOrganization(input.organizationId),
        getLinearIntegrationsByOrganization(input.organizationId),
        getMcpStoreListingsByOrganization(input.organizationId),
      ]);

      return {
        github: github.map((integration) => ({
          id: integration.id,
          displayName: integration.displayName,
          enabled: integration.enabled,
          createdAt: integration.createdAt.toISOString(),
          repositories: integration.repositories.map((repository) => ({
            owner: repository.owner,
            repo: repository.repo,
          })),
        })),
        linear: linear.map((integration) => ({
          id: integration.id,
          displayName: integration.displayName,
          enabled: integration.enabled,
          createdAt: integration.createdAt.toISOString(),
        })),
        mcpServers: mcpServers.map(serializeMcpServerIntegration),
      };
    }),
  mcp: {
    get: baseProcedure
      .input(mcpServerInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const integration = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (
          !integration ||
          integration.organizationId !== input.organizationId
        ) {
          throw notFound("MCP server not found");
        }

        const tools = await getMcpIntegrationTools({
          organizationId: input.organizationId,
          integrationId: input.serverId,
        });

        return {
          integration: serializeMcpServerIntegration(integration),
          tools,
        };
      }),
    update: baseProcedure
      .input(updateMcpServerRequestSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

        const changedAssetUrls = [
          input.logoLightUrl !== existing.logoLightUrl
            ? input.logoLightUrl
            : null,
          input.logoDarkUrl !== existing.logoDarkUrl ? input.logoDarkUrl : null,
          input.bannerUrl !== existing.bannerUrl ? input.bannerUrl : null,
        ];
        if (
          findDisallowedBrandingAssetUrl({
            organizationId: input.organizationId,
            urls: changedAssetUrls,
          })
        ) {
          throw badRequest(
            "Branding images must be uploaded through the console"
          );
        }

        await assertRateLimit({
          key: `mcp-scan:${input.organizationId}`,
          ...MCP_CONNECTION_RATE_LIMIT,
        });

        const hasNewHeaders = Object.keys(input.headers).length > 0;
        const hasStoredHeaders =
          Object.keys(existing.encryptedHeaders ?? {}).length > 0;
        if (
          input.authType === "headers" &&
          !(hasNewHeaders || hasStoredHeaders)
        ) {
          throw badRequest("Add at least one authentication header");
        }

        try {
          const updated = await updateMcpStoreListing(
            {
              integrationId: input.serverId,
              organizationId: input.organizationId,
            },
            {
              name: input.name,
              slug: input.slug,
              url: input.url,
              description: input.description ?? null,
              author: input.author ?? null,
              websiteUrl: input.websiteUrl ?? null,
              brandColor: input.brandColor ?? null,
              logoLightUrl: input.logoLightUrl ?? null,
              logoDarkUrl: input.logoDarkUrl ?? null,
              bannerUrl: input.bannerUrl ?? null,
              ...(input.authType !== existing.authType || hasNewHeaders
                ? { authType: input.authType }
                : {}),
              ...(hasNewHeaders ? { headers: input.headers } : {}),
            }
          );

          if (!updated) {
            throw notFound("MCP server not found");
          }

          if (
            existing.storeStatus === "live" ||
            existing.storeStatus === "pending_review"
          ) {
            await setMcpStoreStatus({
              organizationId: input.organizationId,
              integrationId: input.serverId,
              status: "pending_review",
            });
          }

          const refreshed = await getMcpStoreListing({
            integrationId: input.serverId,
            organizationId: input.organizationId,
          });
          return serializeMcpServerIntegration(refreshed ?? updated);
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throwUniqueConstraintConflict(error);
          }
          if (error instanceof PublicUrlValidationError) {
            throw badRequest(error.message);
          }

          throw internalServerError("Failed to update MCP server", error);
        }
      }),
    setEnabled: baseProcedure
      .input(setMcpServerEnabledRequestSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

        const updated = await updateMcpStoreListing(
          {
            integrationId: input.serverId,
            organizationId: input.organizationId,
          },
          { enabled: input.enabled }
        );
        if (!updated) {
          throw notFound("MCP server not found");
        }

        return serializeMcpServerIntegration(updated);
      }),
    beginOAuth: baseProcedure
      .input(beginMcpOAuthScanRequestSchema)
      .handler(async ({ context, input }) => {
        const access = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }
        if (existing.authType !== "oauth") {
          throw badRequest("This integration does not use OAuth");
        }

        await assertRateLimit({
          key: `mcp-scan:${input.organizationId}`,
          ...MCP_CONNECTION_RATE_LIMIT,
        });

        const baseUrl =
          process.env.CONSOLE_APP_URL ??
          (process.env.NODE_ENV === "production"
            ? undefined
            : "http://localhost:3003");
        if (!baseUrl) {
          throw internalServerError("MCP OAuth is not configured");
        }

        try {
          return await Effect.runPromise(
            beginMcpOAuthAuthorization({
              organizationId: input.organizationId,
              userId: access.user.id,
              serverIntegrationId: existing.id,
              name: existing.name,
              url: existing.url,
              description: existing.description,
              callbackPath: input.callbackPath,
              redirectUrl: `${baseUrl}${MCP_OAUTH_CALLBACK_PATH}`,
              resourceType: "store_listing",
            })
          );
        } catch (error) {
          if (
            error instanceof McpOAuthAuthorizationError ||
            error instanceof PublicUrlValidationError
          ) {
            throw badRequest(error.message);
          }
          throw internalServerError("Failed to start MCP OAuth", error);
        }
      }),
    scan: baseProcedure
      .input(mcpServerInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }
        if (!existing.enabled) {
          throw badRequest("Enable this integration before scanning its tools");
        }

        await assertRateLimit({
          key: `mcp-scan:${input.organizationId}`,
          ...MCP_CONNECTION_RATE_LIMIT,
        });

        try {
          await refreshMcpToolIndexForIntegration({
            organizationId: input.organizationId,
            integrationId: input.serverId,
          });
        } catch (error) {
          throw badRequest(
            error instanceof Error
              ? error.message
              : "Could not read tools from this server"
          );
        }

        return {
          tools: await getMcpIntegrationTools({
            organizationId: input.organizationId,
            integrationId: input.serverId,
          }),
        };
      }),
    updateToolPhrases: baseProcedure
      .input(updateMcpToolPhrasesRequestSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

        const appliedCount = await updateMcpToolActionPhrases({
          organizationId: input.organizationId,
          integrationId: input.serverId,
          manualToolNames: input.manualToolNames,
          updates: input.tools,
        });

        if (
          (existing.storeStatus === "live" ||
            existing.storeStatus === "pending_review") &&
          appliedCount > 0
        ) {
          await setMcpStoreStatus({
            organizationId: input.organizationId,
            integrationId: input.serverId,
            status: "pending_review",
          });
        }

        return {
          tools: await getMcpIntegrationTools({
            organizationId: input.organizationId,
            integrationId: input.serverId,
          }),
        };
      }),
    submitForReview: baseProcedure
      .input(submitMcpServerForReviewRequestSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }
        if (existing.storeStatus === "live") {
          throw badRequest("This integration is already live");
        }
        if (existing.storeStatus === "pending_review") {
          throw badRequest("This integration is already in review");
        }

        await setMcpStoreStatus({
          organizationId: input.organizationId,
          integrationId: input.serverId,
          status: "pending_review",
        });

        const refreshed = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        return serializeMcpServerIntegration(refreshed ?? existing);
      }),
    create: baseProcedure
      .input(createMcpServerRequestSchema)
      .handler(async ({ context, input }) => {
        const access = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        if (
          findDisallowedBrandingAssetUrl({
            organizationId: input.organizationId,
            urls: [input.logoLightUrl, input.logoDarkUrl, input.bannerUrl],
          })
        ) {
          throw badRequest(
            "Branding images must be uploaded through the console"
          );
        }

        await assertRateLimit({
          key: `mcp-scan:${input.organizationId}`,
          ...MCP_CONNECTION_RATE_LIMIT,
        });

        try {
          const integration = await createMcpStoreListing({
            authType: input.authType,
            organizationId: input.organizationId,
            userId: access.user.id,
            name: input.name,
            slug: input.slug,
            url: input.url,
            description: input.description ?? null,
            author: input.author ?? null,
            websiteUrl: input.websiteUrl ?? null,
            brandColor: input.brandColor ?? null,
            logoLightUrl: input.logoLightUrl ?? null,
            logoDarkUrl: input.logoDarkUrl ?? null,
            bannerUrl: input.bannerUrl ?? null,
            headers: input.headers,
          });

          return serializeMcpServerIntegration(integration);
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throwUniqueConstraintConflict(error);
          }
          if (error instanceof PublicUrlValidationError) {
            throw badRequest(error.message);
          }

          throw internalServerError("Failed to create MCP server", error);
        }
      }),
    delete: baseProcedure
      .input(mcpServerInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

        const deleted = await deleteMcpStoreListing({
          integrationId: input.serverId,
          organizationId: input.organizationId,
        });
        if (!deleted) {
          throw notFound("MCP store listing not found");
        }
        return { success: true };
      }),
    scanDraft: baseProcedure
      .input(testMcpServerRequestSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await assertRateLimit({
          key: `mcp-scan:${input.organizationId}`,
          ...MCP_CONNECTION_RATE_LIMIT,
        });

        try {
          const definitions = await listMcpServerToolsPreview({
            url: input.url,
            headers: input.headers,
          });

          return {
            tools: definitions.map((definition) => ({
              id: definition.name,
              serverToolName: definition.name,
              title: definition.title,
              description: definition.description,
              actionPhrasePresent: null,
              actionPhrasePast: null,
            })),
          };
        } catch {
          throw badRequest(
            "Could not read tools from this server. Check the URL and credentials."
          );
        }
      }),
    test: baseProcedure
      .input(testMcpServerRequestSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await assertRateLimit({
          key: `mcp-test:${input.organizationId}`,
          ...MCP_CONNECTION_RATE_LIMIT,
        });

        return testMcpServerConnection({
          url: input.url,
          headers: input.headers,
        });
      }),
  },
};
