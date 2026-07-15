import { getGitHubIntegrationsByOrganization } from "@notra/ai/integrations/github";
import { getLinearIntegrationsByOrganization } from "@notra/ai/integrations/linear";
import {
  createMcpServerIntegration,
  deleteMcpServerIntegration,
  getMcpServerIntegrationById,
  getMcpServerIntegrationsByOrganization,
  serializeMcpServerIntegration,
  testMcpServerConnection,
  updateMcpServerIntegration,
} from "@notra/ai/integrations/mcp";
import {
  getMcpIntegrationTools,
  setMcpStoreStatus,
  updateMcpToolActionPhrases,
} from "@notra/ai/integrations/mcp-store";
import { refreshMcpToolIndexForIntegration } from "@notra/ai/integrations/mcp-tool-index";
import { PublicUrlValidationError } from "@notra/utils/url";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { findDisallowedBrandingAssetUrl } from "@/lib/integrations/branding-urls";
import { baseProcedure } from "@/lib/orpc/base";
import {
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

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

const mcpServerInputSchema = organizationIdInputSchema.extend({
  serverId: z.string().min(1, "MCP server ID is required"),
});

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
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
        getMcpServerIntegrationsByOrganization(input.organizationId),
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

        const integration = await getMcpServerIntegrationById(input.serverId);
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

        const existing = await getMcpServerIntegrationById(input.serverId);
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
          const updated = await updateMcpServerIntegration(input.serverId, {
            name: input.name,
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
          });

          if (!updated) {
            throw notFound("MCP server not found");
          }

          if (existing.storeStatus === "live") {
            await setMcpStoreStatus({
              integrationId: input.serverId,
              status: "pending_review",
            });
          }

          const refreshed = await getMcpServerIntegrationById(input.serverId);
          return serializeMcpServerIntegration(refreshed ?? updated);
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            throw conflict("An MCP server with this name already exists");
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

        const existing = await getMcpServerIntegrationById(input.serverId);
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

        const updated = await updateMcpServerIntegration(input.serverId, {
          enabled: input.enabled,
        });
        if (!updated) {
          throw notFound("MCP server not found");
        }

        return serializeMcpServerIntegration(updated);
      }),
    scan: baseProcedure
      .input(mcpServerInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getMcpServerIntegrationById(input.serverId);
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

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

        const existing = await getMcpServerIntegrationById(input.serverId);
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

        await updateMcpToolActionPhrases({
          organizationId: input.organizationId,
          integrationId: input.serverId,
          updates: input.tools,
        });

        if (existing.storeStatus === "live" && input.tools.length > 0) {
          await setMcpStoreStatus({
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

        const existing = await getMcpServerIntegrationById(input.serverId);
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
          integrationId: input.serverId,
          status: "pending_review",
        });

        const refreshed = await getMcpServerIntegrationById(input.serverId);
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

        try {
          const integration = await createMcpServerIntegration({
            authType: input.authType,
            organizationId: input.organizationId,
            userId: access.user.id,
            name: input.name,
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
            throw conflict("An MCP server with this name already exists");
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

        const existing = await getMcpServerIntegrationById(input.serverId);
        if (!existing || existing.organizationId !== input.organizationId) {
          throw notFound("MCP server not found");
        }

        await deleteMcpServerIntegration(input.serverId);
        return { success: true };
      }),
    test: baseProcedure
      .input(testMcpServerRequestSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        return testMcpServerConnection({
          url: input.url,
          headers: input.headers,
        });
      }),
  },
};
