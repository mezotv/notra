import {
  deleteGitHubAppInstallationForOrganization,
  GitHubAppNotConfiguredError,
  getGitHubAppInstallationByOrganization,
  getGitHubAppInstallUrl,
  getSelectedGitHubAppRepositoryIds,
  listGitHubAppRepositories,
  setSelectedGitHubAppRepositories,
} from "@notra/ai/integrations/github";
import { createOctokit } from "@notra/ai/utils/octokit";
import { redis } from "@notra/ai/utils/redis";
import { Data, Effect } from "effect";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way of importing
import * as z from "zod";
import { GITHUB_INSTALL_STATE_TTL_SECONDS } from "@/constants/github";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { authorizedProcedure } from "@/lib/orpc/base";
import {
  badRequest,
  internalServerError,
  notFound,
} from "@/lib/orpc/utils/errors";
import type { GitHubAccountType } from "@/types/integrations/github";

const probeRepositoryInputSchema = z.object({
  owner: z.string().trim().min(1, "owner is required"),
  repo: z.string().trim().min(1, "repo is required"),
  token: z.string().trim().optional(),
});

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

const saveGitHubAppRepositoriesInputSchema = organizationIdInputSchema.extend({
  repositoryIds: z.array(z.string().min(1)).default([]),
});

const prepareInstallUrlInputSchema = organizationIdInputSchema.extend({
  callbackPath: z.string().trim().min(1, "Callback path is required"),
});

class GitHubAppInstallPreparationError extends Data.TaggedError(
  "GitHubAppInstallPreparationError"
)<{
  readonly message: string;
  readonly cause: unknown;
}> {}

class GitHubRepositoryProbeError extends Data.TaggedError(
  "GitHubRepositoryProbeError"
)<{
  readonly cause: unknown;
}> {}

class GitHubAppRequestError extends Data.TaggedError("GitHubAppRequestError")<{
  readonly message: string;
  readonly cause: unknown;
}> {}

function toGitHubAppRequestError(cause: unknown) {
  return new GitHubAppRequestError({
    message:
      cause instanceof Error ? cause.message : "GitHub App request failed",
    cause,
  });
}

function mapGitHubAppRequestError(error: GitHubAppRequestError): never {
  if (error.cause instanceof GitHubAppNotConfiguredError) {
    throw badRequest("GitHub App is not configured");
  }

  if (error.cause instanceof Error) {
    throw internalServerError("GitHub App request failed", error.cause);
  }

  throw internalServerError(error.message, error.cause);
}

function mapGitHubAppInstallPreparationError(
  error: GitHubAppInstallPreparationError
): never {
  if (error.cause instanceof GitHubAppNotConfiguredError) {
    throw badRequest("GitHub App is not configured");
  }

  throw internalServerError(error.message, error.cause);
}

function hasNumericStatus(error: unknown): error is Error & { status: number } {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  );
}

function mapGitHubRepositoryProbeError(
  error: GitHubRepositoryProbeError
): never {
  const status = hasNumericStatus(error.cause) ? error.cause.status : 500;

  if (status === 404) {
    throw badRequest("Repository not found", { status: "not_found" });
  }

  if (status === 401 || status === 403) {
    throw badRequest("Repository access denied", {
      status: "unauthorized",
    });
  }

  throw internalServerError("Failed to probe repository", error.cause);
}

function toGitHubAccountType(accountType: string): GitHubAccountType {
  return accountType === "Organization" ? "Organization" : "User";
}

const prepareGitHubAppInstall = Effect.fn("prepareGitHubAppInstall")(function* (
  input: z.infer<typeof prepareInstallUrlInputSchema> & {
    userId: string;
  }
) {
  const redisClient = redis;

  if (!redisClient) {
    return yield* Effect.fail(
      new GitHubAppInstallPreparationError({
        message: "GitHub App is not configured",
        cause: new GitHubAppNotConfiguredError(),
      })
    );
  }

  const state = crypto.randomUUID();

  yield* Effect.tryPromise({
    try: () =>
      redisClient.set(
        `github_app_install:${state}`,
        JSON.stringify({
          organizationId: input.organizationId,
          userId: input.userId,
          callbackPath: input.callbackPath,
        }),
        { ex: GITHUB_INSTALL_STATE_TTL_SECONDS }
      ),
    catch: (cause) =>
      new GitHubAppInstallPreparationError({
        message: "Failed to store GitHub App install state",
        cause,
      }),
  });

  const url = yield* Effect.try({
    try: () => getGitHubAppInstallUrl(state),
    catch: (cause) =>
      new GitHubAppInstallPreparationError({
        message: "Failed to prepare GitHub App install URL",
        cause,
      }),
  });

  return { url };
});

export const githubRouter = {
  app: {
    get: authorizedProcedure
      .input(organizationIdInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const installation = await getGitHubAppInstallationByOrganization(
          input.organizationId
        );

        if (!installation) {
          return {
            account: null,
            repositories: [],
            selectedRepositoryIds: [],
          };
        }

        return Effect.runPromise(
          Effect.tryPromise({
            try: async () => {
              const [repositories, selectedRepositoryIds] = await Promise.all([
                listGitHubAppRepositories(input.organizationId),
                getSelectedGitHubAppRepositoryIds(
                  input.organizationId,
                  installation.installationId
                ),
              ]);

              return {
                account: {
                  id: installation.accountId,
                  login: installation.accountLogin,
                  name: installation.accountName,
                  avatarUrl: installation.accountAvatarUrl,
                  type: toGitHubAccountType(installation.accountType),
                },
                repositories,
                selectedRepositoryIds,
              };
            },
            catch: toGitHubAppRequestError,
          }).pipe(
            Effect.match({
              onFailure: mapGitHubAppRequestError,
              onSuccess: (githubApp) => githubApp,
            })
          )
        );
      }),
    saveRepositories: authorizedProcedure
      .input(saveGitHubAppRepositoriesInputSchema)
      .handler(async ({ context, input }) => {
        const auth = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        return Effect.runPromise(
          Effect.tryPromise({
            try: () =>
              setSelectedGitHubAppRepositories({
                organizationId: input.organizationId,
                userId: auth.user.id,
                repositoryIds: input.repositoryIds,
              }),
            catch: toGitHubAppRequestError,
          }).pipe(
            Effect.match({
              onFailure: mapGitHubAppRequestError,
              onSuccess: (selection) => selection,
            })
          )
        );
      }),
    disconnect: authorizedProcedure
      .input(organizationIdInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const installation = await getGitHubAppInstallationByOrganization(
          input.organizationId
        );

        if (!installation) {
          throw notFound("GitHub App installation not found");
        }

        await deleteGitHubAppInstallationForOrganization(input.organizationId);

        return { success: true };
      }),
    prepareInstallUrl: authorizedProcedure
      .input(prepareInstallUrlInputSchema)
      .handler(async ({ context, input }) => {
        const auth = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        return Effect.runPromise(
          prepareGitHubAppInstall({
            ...input,
            userId: auth.user.id,
          }).pipe(
            Effect.match({
              onFailure: mapGitHubAppInstallPreparationError,
              onSuccess: (preparedInstall) => preparedInstall,
            })
          )
        );
      }),
  },
  probeRepository: authorizedProcedure
    .input(probeRepositoryInputSchema)
    .handler(async ({ input }) => {
      const octokit = createOctokit(input.token || undefined);

      return Effect.runPromise(
        Effect.tryPromise({
          try: async () => {
            const { data } = await octokit.request(
              "GET /repos/{owner}/{repo}",
              {
                owner: input.owner,
                repo: input.repo,
                headers: { "X-GitHub-Api-Version": "2022-11-28" },
              }
            );

            return {
              defaultBranch: data.default_branch,
              description: data.description,
              status: data.private ? "private" : "public",
            };
          },
          catch: (cause) => new GitHubRepositoryProbeError({ cause }),
        }).pipe(
          Effect.match({
            onFailure: mapGitHubRepositoryProbeError,
            onSuccess: (repository) => repository,
          })
        )
      );
    }),
};
