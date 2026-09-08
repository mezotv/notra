import { randomBytes } from "node:crypto";

import { db } from "@notra/db/drizzle";
import {
  githubAppInstallations,
  githubIntegrations,
  organizations,
  repositoryOutputs,
} from "@notra/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { Effect } from "effect";
import { customAlphabet } from "nanoid";

import { encryptToken } from "../crypto/token-encryption";
import {
  GitHubInstallationMissingError,
  GitHubPersistenceError,
  GitHubRepositoryConflictError,
} from "../schemas/github-operations";
import type { SaveGitHubRepositorySelectionParams } from "../types/github-operations";
import { planGitHubRepositorySelection } from "./plan-github-repository-selection";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);

export const saveGitHubRepositorySelection = Effect.fn(
  "GitHub.saveRepositorySelection"
)((params: SaveGitHubRepositorySelectionParams) =>
  Effect.tryPromise({
    try: () =>
      db.transaction(async (tx) => {
        // Serialize selection changes for this organization, including saves
        // where no repository records exist yet.
        await tx
          .select({ id: organizations.id })
          .from(organizations)
          .where(eq(organizations.id, params.organizationId))
          .for("update")
          .$withCache(false);

        const installations = await tx
          .select({ id: githubAppInstallations.id })
          .from(githubAppInstallations)
          .where(
            and(
              eq(githubAppInstallations.organizationId, params.organizationId),
              eq(githubAppInstallations.enabled, true),
              inArray(githubAppInstallations.id, params.installationRecordIds)
            )
          )
          .for("share")
          .$withCache(false);
        const installationIds = new Set(
          installations.map((installation) => installation.id)
        );
        if (
          installationIds.size !== params.installationRecordIds.length ||
          params.repositories.some(
            (selected) => !installationIds.has(selected.installationRecordId)
          )
        ) {
          throw new GitHubInstallationMissingError({
            organizationId: params.organizationId,
          });
        }

        const existing = await tx
          .select({
            id: githubIntegrations.id,
            owner: githubIntegrations.owner,
            repo: githubIntegrations.repo,
            githubRepositoryId: githubIntegrations.githubRepositoryId,
            githubAppInstallationId: githubIntegrations.githubAppInstallationId,
          })
          .from(githubIntegrations)
          .where(eq(githubIntegrations.organizationId, params.organizationId))
          .orderBy(githubIntegrations.id)
          .for("update")
          .$withCache(false);
        const { selections, deselectedIds } = planGitHubRepositorySelection(
          existing,
          params
        );
        if (deselectedIds.length > 0) {
          await tx
            .update(githubIntegrations)
            .set({ enabled: false, repositoryEnabled: false })
            .where(
              and(
                eq(githubIntegrations.organizationId, params.organizationId),
                inArray(githubIntegrations.id, deselectedIds)
              )
            );
        }

        for (const {
          repository,
          installationRecordId,
          integrationId,
        } of selections) {
          const values = {
            displayName: repository.fullName,
            owner: repository.owner,
            repo: repository.name,
            defaultBranch: repository.defaultBranch,
            encryptedToken: null,
            githubAppInstallationId: installationRecordId,
            githubRepositoryId: repository.id,
            githubRepositoryPrivate: repository.private,
            repositoryEnabled: true,
            enabled: true,
          };
          if (integrationId) {
            await tx
              .update(githubIntegrations)
              .set(values)
              .where(
                and(
                  eq(githubIntegrations.organizationId, params.organizationId),
                  eq(githubIntegrations.id, integrationId)
                )
              );
            continue;
          }

          const id = nanoid();
          await tx.insert(githubIntegrations).values({
            ...values,
            id,
            organizationId: params.organizationId,
            createdByUserId: params.userId,
            encryptedWebhookSecret: encryptToken(
              randomBytes(32).toString("hex")
            ),
          });
          await tx.insert(repositoryOutputs).values([
            {
              id: nanoid(),
              repositoryId: id,
              outputType: "changelog",
              enabled: true,
              config: null,
            },
            {
              id: nanoid(),
              repositoryId: id,
              outputType: "blog_post",
              enabled: false,
              config: null,
            },
            {
              id: nanoid(),
              repositoryId: id,
              outputType: "twitter_post",
              enabled: false,
              config: null,
            },
          ]);
        }
      }),
    catch: (cause) =>
      cause instanceof GitHubRepositoryConflictError ||
      cause instanceof GitHubInstallationMissingError
        ? cause
        : new GitHubPersistenceError({
            operation: "saveRepositorySelection",
            cause,
          }),
  })
);
