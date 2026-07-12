import { getGitHubIntegrationsByOrganization } from "@notra/ai/integrations/github";
import { getLinearIntegrationsByOrganization } from "@notra/ai/integrations/linear";
import {
  createMcpServerIntegration,
  deleteMcpServerIntegration,
  getMcpServerIntegrationById,
  getMcpServerIntegrationsByOrganization,
  serializeMcpServerIntegration,
  testMcpServerConnection,
} from "@notra/ai/integrations/mcp";
import { PublicUrlValidationError } from "@notra/utils/url";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { baseProcedure } from "@/lib/orpc/base";
import {
  createMcpServerRequestSchema,
  testMcpServerRequestSchema,
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
    create: baseProcedure
      .input(createMcpServerRequestSchema)
      .handler(async ({ context, input }) => {
        const access = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        try {
          const integration = await createMcpServerIntegration({
            authType: input.authType,
            organizationId: input.organizationId,
            userId: access.user.id,
            name: input.name,
            url: input.url,
            description: input.description ?? null,
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
