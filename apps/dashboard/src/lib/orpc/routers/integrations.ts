import { db } from "@notra/db/drizzle";
import { contentTriggers } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { baseProcedure } from "@/lib/orpc/base";
import {
  addRepository,
  configureOutput,
  createGitHubIntegration,
  deleteGitHubIntegration,
  deleteRepository,
  GitHubBranchNotFoundError,
  generateWebhookSecretForRepository,
  getGitHubIntegrationById,
  getOutputById,
  getRepositoryById,
  getWebhookConfigForRepository,
  listAvailableRepositories,
  toggleOutput,
  updateGitHubIntegration,
  updateGitHubIntegrationToken,
  updateRepository,
  validateRepositoryBranchExists,
} from "@/lib/services/github-integration";
import { getIntegrationsByOrganization } from "@/lib/services/integrations";
import {
  deleteLinearIntegration,
  getLinearIntegrationById,
  getLinearIntegrationsByOrganization,
  updateLinearIntegration,
} from "@/lib/services/linear-integration";
import { deleteQstashSchedule } from "@/lib/triggers/qstash";
import {
  addRepositoryRequestSchema,
  configureOutputBodySchema,
  createGitHubIntegrationRequestSchema,
  type IntegrationType,
  integrationIdParamSchema,
  outputIdParamSchema,
  repositoryIdParamSchema,
  triggerTargetsSchema,
  updateIntegrationBodySchema,
  updateOutputBodySchema,
  updateRepositoryBodySchema,
} from "@/schemas/integrations";
import { updateLinearIntegrationBodySchema } from "@/schemas/linear";
import type {
  GitHubIntegration,
  GitHubRepository,
  RepositoryOutput,
} from "@/types/integrations";
import {
  badRequest,
  conflict,
  internalServerError,
  notFound,
} from "../utils/errors";

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

const integrationInputSchema = organizationIdInputSchema.extend({
  integrationId: integrationIdParamSchema.shape.integrationId,
});

const repositoryInputSchema = organizationIdInputSchema.extend({
  repositoryId: repositoryIdParamSchema.shape.repositoryId,
});

const outputInputSchema = organizationIdInputSchema.extend({
  outputId: outputIdParamSchema.shape.outputId,
});

function serializeRepositoryOutput(output: {
  id: string;
  outputType: string;
  enabled: boolean;
}): RepositoryOutput {
  return {
    id: output.id,
    outputType: output.outputType,
    enabled: output.enabled,
  };
}

function serializeRepository(repository: {
  id: string;
  owner: string;
  repo: string;
  defaultBranch: string | null;
  enabled: boolean;
  encryptedWebhookSecret?: string | null;
  outputs?: Array<{
    id: string;
    outputType: string;
    enabled: boolean;
  }>;
}): GitHubRepository {
  return {
    id: repository.id,
    owner: repository.owner,
    repo: repository.repo,
    defaultBranch: repository.defaultBranch,
    enabled: repository.enabled,
    ...(repository.encryptedWebhookSecret !== undefined
      ? { hasWebhook: Boolean(repository.encryptedWebhookSecret) }
      : {}),
    ...(repository.outputs
      ? {
          outputs: repository.outputs.map(serializeRepositoryOutput),
        }
      : {}),
  };
}

function serializeIntegration(integration: {
  id: string;
  displayName: string;
  enabled: boolean;
  createdAt: Date;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  repositories: Array<{
    id: string;
    owner: string;
    repo: string;
    defaultBranch: string | null;
    enabled: boolean;
    encryptedWebhookSecret?: string | null;
    outputs?: Array<{
      id: string;
      outputType: string;
      enabled: boolean;
    }>;
  }>;
}): GitHubIntegration {
  return {
    id: integration.id,
    displayName: integration.displayName,
    enabled: integration.enabled,
    createdAt: integration.createdAt.toISOString(),
    ...(integration.createdByUser
      ? { createdByUser: integration.createdByUser }
      : {}),
    repositories: integration.repositories.map(serializeRepository),
  };
}

function serializeListedIntegration(integration: {
  type: string;
  id: string;
  displayName: string;
  enabled: boolean;
  createdAt: Date;
  repositories: Array<{
    id: string;
    owner: string;
    repo: string;
    defaultBranch: string | null;
    enabled: boolean;
    encryptedWebhookSecret?: string | null;
    outputs?: Array<{
      id: string;
      outputType: string;
      enabled: boolean;
    }>;
  }>;
}): GitHubIntegration & { type: IntegrationType } {
  return {
    ...serializeIntegration(integration),
    type: integration.type as IntegrationType,
  };
}

async function requireIntegrationInOrganization(
  organizationId: string,
  integrationId: string
) {
  const integration = await getGitHubIntegrationById(integrationId);

  if (!integration || integration.organizationId !== organizationId) {
    throw notFound("Integration not found");
  }

  return integration;
}

async function requireRepositoryInOrganization(
  organizationId: string,
  repositoryId: string
) {
  const repository = await getRepositoryById(repositoryId);

  if (!repository || repository.integration.organizationId !== organizationId) {
    throw notFound("Repository not found");
  }

  return repository;
}

async function requireOutputInOrganization(
  organizationId: string,
  outputId: string
) {
  const output = await getOutputById(outputId);

  if (
    !output ||
    output.repository.integration.organizationId !== organizationId
  ) {
    throw notFound("Output not found");
  }

  return output;
}

async function getAffectedSchedulesForIntegration(
  organizationId: string,
  integrationId: string
) {
  const allSchedules = await db.query.contentTriggers.findMany({
    where: and(
      eq(contentTriggers.organizationId, organizationId),
      eq(contentTriggers.sourceType, "cron")
    ),
  });

  return allSchedules.filter((schedule) => {
    const parsed = triggerTargetsSchema.safeParse(schedule.targets);

    if (!parsed.success) {
      return false;
    }

    return parsed.data.repositoryIds.includes(integrationId);
  });
}

function mapKnownIntegrationError(error: unknown): never {
  if (
    error instanceof Error &&
    error.message === "Repository already connected"
  ) {
    throw conflict("Repository already connected");
  }

  if (
    error instanceof Error &&
    error.message.includes("exactly one repository")
  ) {
    throw badRequest("Please select exactly one repository");
  }

  if (error instanceof GitHubBranchNotFoundError) {
    throw badRequest(error.message);
  }

  if (error instanceof Error) {
    throw badRequest(error.message);
  }

  throw internalServerError("Internal server error", error);
}

export const integrationsRouter = {
  list: baseProcedure
    .input(organizationIdInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const result = await getIntegrationsByOrganization(input.organizationId);

      return {
        integrations: result.integrations.map(serializeListedIntegration),
        count: result.count,
      };
    }),
  create: baseProcedure
    .input(createGitHubIntegrationRequestSchema)
    .handler(async ({ context, input }) => {
      const auth = await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      try {
        const displayName = `${input.owner}/${input.repo}`;

        return await createGitHubIntegration({
          organizationId: input.organizationId,
          userId: auth.user.id,
          token: input.token || null,
          displayName,
          owner: input.owner,
          repo: input.repo,
          defaultBranch: input.branch || null,
        }).then(serializeIntegration);
      } catch (error) {
        mapKnownIntegrationError(error);
      }
    }),
  get: baseProcedure
    .input(integrationInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const integration = await requireIntegrationInOrganization(
        input.organizationId,
        input.integrationId
      );

      return serializeIntegration(integration);
    }),
  update: baseProcedure
    .input(integrationInputSchema.and(updateIntegrationBodySchema))
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const integration = await requireIntegrationInOrganization(
        input.organizationId,
        input.integrationId
      );

      const normalizedBranch =
        input.branch !== undefined ? input.branch || null : undefined;

      try {
        if (input.token !== undefined) {
          await updateGitHubIntegrationToken(input.integrationId, input.token);
        }

        if (normalizedBranch !== undefined) {
          if (integration.repositories.length !== 1) {
            throw badRequest(
              "Branch can only be edited for integrations with a single repository"
            );
          }

          const repository = integration.repositories[0];

          if (!repository) {
            throw notFound("Repository not found");
          }

          if (normalizedBranch) {
            await validateRepositoryBranchExists({
              owner: repository.owner,
              repo: repository.repo,
              branch: normalizedBranch,
              token: input.token,
              encryptedToken: integration.encryptedToken,
            });
          }

          await updateRepository(repository.id, {
            defaultBranch: normalizedBranch,
          });
        }

        if (input.enabled !== undefined || input.displayName !== undefined) {
          await updateGitHubIntegration(input.integrationId, {
            enabled: input.enabled,
            displayName: input.displayName,
          });
        }

        const updated = await requireIntegrationInOrganization(
          input.organizationId,
          input.integrationId
        );

        return serializeIntegration(updated);
      } catch (error) {
        mapKnownIntegrationError(error);
      }
    }),
  delete: baseProcedure
    .input(integrationInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      await requireIntegrationInOrganization(
        input.organizationId,
        input.integrationId
      );

      const affectedSchedules = await getAffectedSchedulesForIntegration(
        input.organizationId,
        input.integrationId
      );

      for (const schedule of affectedSchedules) {
        if (schedule.qstashScheduleId) {
          await deleteQstashSchedule(schedule.qstashScheduleId).catch(
            (error) => {
              console.error(
                `Failed to delete qstash schedule ${schedule.qstashScheduleId}:`,
                error
              );
            }
          );
        }

        await db
          .update(contentTriggers)
          .set({
            enabled: false,
            qstashScheduleId: null,
            updatedAt: new Date(),
          })
          .where(eq(contentTriggers.id, schedule.id));
      }

      await deleteGitHubIntegration(input.integrationId);

      return {
        success: true,
        disabledSchedules: affectedSchedules.map((schedule) => ({
          id: schedule.id,
          name: schedule.name,
        })),
      };
    }),
  affectedSchedules: baseProcedure
    .input(integrationInputSchema)
    .handler(async ({ context, input }) => {
      await assertOrganizationAccess({
        headers: context.headers,
        organizationId: input.organizationId,
      });

      const integration = await requireIntegrationInOrganization(
        input.organizationId,
        input.integrationId
      );
      const affectedSchedules = await getAffectedSchedulesForIntegration(
        input.organizationId,
        input.integrationId
      );

      return {
        ...serializeIntegration(integration),
        affectedSchedules: affectedSchedules.map((schedule) => ({
          id: schedule.id,
          name: schedule.name,
          enabled: schedule.enabled,
        })),
      };
    }),
  repositories: {
    listAvailable: baseProcedure
      .input(integrationInputSchema)
      .handler(async ({ context, input }) => {
        const auth = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await requireIntegrationInOrganization(
          input.organizationId,
          input.integrationId
        );

        try {
          return await listAvailableRepositories(
            input.integrationId,
            auth.user.id
          );
        } catch (error) {
          mapKnownIntegrationError(error);
        }
      }),
    add: baseProcedure
      .input(integrationInputSchema.and(addRepositoryRequestSchema))
      .handler(async ({ context, input }) => {
        const auth = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await requireIntegrationInOrganization(
          input.organizationId,
          input.integrationId
        );

        try {
          return await addRepository({
            integrationId: input.integrationId,
            owner: input.owner,
            repo: input.repo,
            outputs: input.outputs,
            userId: auth.user.id,
          });
        } catch (error) {
          mapKnownIntegrationError(error);
        }
      }),
    get: baseProcedure
      .input(repositoryInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const repository = await requireRepositoryInOrganization(
          input.organizationId,
          input.repositoryId
        );

        return serializeRepository(repository);
      }),
    update: baseProcedure
      .input(repositoryInputSchema.and(updateRepositoryBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const repository = await requireRepositoryInOrganization(
          input.organizationId,
          input.repositoryId
        );
        const normalizedDefaultBranch =
          input.defaultBranch !== undefined
            ? input.defaultBranch || null
            : undefined;

        try {
          if (normalizedDefaultBranch) {
            await validateRepositoryBranchExists({
              owner: repository.owner,
              repo: repository.repo,
              branch: normalizedDefaultBranch,
              encryptedToken: repository.integration.encryptedToken,
            });
          }

          const updated = await updateRepository(input.repositoryId, {
            ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
            ...(normalizedDefaultBranch !== undefined
              ? { defaultBranch: normalizedDefaultBranch }
              : {}),
          });

          if (!updated) {
            throw notFound("Repository not found");
          }

          const refreshed = await requireRepositoryInOrganization(
            input.organizationId,
            input.repositoryId
          );

          return serializeRepository(refreshed);
        } catch (error) {
          mapKnownIntegrationError(error);
        }
      }),
    delete: baseProcedure
      .input(repositoryInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await requireRepositoryInOrganization(
          input.organizationId,
          input.repositoryId
        );
        await deleteRepository(input.repositoryId);

        return { success: true };
      }),
    configureOutput: baseProcedure
      .input(repositoryInputSchema.and(configureOutputBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await requireRepositoryInOrganization(
          input.organizationId,
          input.repositoryId
        );

        return configureOutput({
          repositoryId: input.repositoryId,
          outputType: input.outputType,
          enabled: input.enabled,
          config: input.config,
        });
      }),
    webhook: {
      get: baseProcedure
        .input(repositoryInputSchema)
        .handler(async ({ context, input }) => {
          const auth = await assertOrganizationAccess({
            headers: context.headers,
            organizationId: input.organizationId,
          });

          await requireRepositoryInOrganization(
            input.organizationId,
            input.repositoryId
          );

          try {
            const config = await getWebhookConfigForRepository(
              input.repositoryId,
              auth.user.id
            );

            if (!config) {
              throw notFound("Webhook not configured");
            }

            return config;
          } catch (error) {
            if (
              error instanceof Error &&
              error.message === "Webhook not configured"
            ) {
              throw notFound("Webhook not configured");
            }

            mapKnownIntegrationError(error);
          }
        }),
      generateSecret: baseProcedure
        .input(repositoryInputSchema)
        .handler(async ({ context, input }) => {
          const auth = await assertOrganizationAccess({
            headers: context.headers,
            organizationId: input.organizationId,
          });

          await requireRepositoryInOrganization(
            input.organizationId,
            input.repositoryId
          );

          try {
            return await generateWebhookSecretForRepository(
              input.repositoryId,
              auth.user.id
            );
          } catch (error) {
            mapKnownIntegrationError(error);
          }
        }),
    },
  },
  outputs: {
    update: baseProcedure
      .input(outputInputSchema.and(updateOutputBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        await requireOutputInOrganization(input.organizationId, input.outputId);

        return toggleOutput(input.outputId, input.enabled);
      }),
  },
  linear: {
    list: baseProcedure
      .input(organizationIdInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const integrations = await getLinearIntegrationsByOrganization(
          input.organizationId
        );

        return {
          integrations: integrations.map((integration) => ({
            id: integration.id,
            displayName: integration.displayName,
            enabled: integration.enabled,
            createdAt: integration.createdAt.toISOString(),
            linearOrganizationName: integration.linearOrganizationName,
            linearTeamName: integration.linearTeamName,
            createdByUser: integration.createdByUser
              ? {
                  id: integration.createdByUser.id,
                  name: integration.createdByUser.name,
                  email: integration.createdByUser.email,
                  image: integration.createdByUser.image,
                }
              : undefined,
          })),
        };
      }),
    get: baseProcedure
      .input(integrationInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const integration = await getLinearIntegrationById(input.integrationId);

        if (!integration) {
          return notFound("Linear integration not found");
        }

        if (integration.organizationId !== input.organizationId) {
          return notFound("Linear integration not found");
        }

        return {
          id: integration.id,
          displayName: integration.displayName,
          enabled: integration.enabled,
          createdAt: integration.createdAt.toISOString(),
          linearOrganizationId: integration.linearOrganizationId,
          linearOrganizationName: integration.linearOrganizationName,
          linearTeamId: integration.linearTeamId,
          linearTeamName: integration.linearTeamName,
          createdByUser: integration.createdByUser
            ? {
                id: integration.createdByUser.id,
                name: integration.createdByUser.name,
                email: integration.createdByUser.email,
                image: integration.createdByUser.image,
              }
            : undefined,
        };
      }),
    update: baseProcedure
      .input(integrationInputSchema.and(updateLinearIntegrationBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getLinearIntegrationById(input.integrationId);
        if (!existing || existing.organizationId !== input.organizationId) {
          return notFound("Linear integration not found");
        }

        const updated = await updateLinearIntegration(input.integrationId, {
          enabled: input.enabled,
          displayName: input.displayName,
          linearTeamId: input.linearTeamId,
          linearTeamName: input.linearTeamName,
        });

        return updated;
      }),
    delete: baseProcedure
      .input(integrationInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await getLinearIntegrationById(input.integrationId);
        if (!existing || existing.organizationId !== input.organizationId) {
          return notFound("Linear integration not found");
        }

        await deleteLinearIntegration(input.integrationId);

        return { success: true };
      }),
  },
};
