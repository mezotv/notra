import "dotenv/config";
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../src/schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not defined");
  process.exit(1);
}

const db = drizzle(databaseUrl, { schema });

type TriggerTargets = {
  repositoryIds?: string[];
};

type LegacyRepository = {
  id: string;
  integrationId: string;
  owner: string;
  repo: string;
  defaultBranch: string | null;
  enabled: boolean;
  encryptedWebhookSecret: string | null;
};

function formatItems(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

async function migrate() {
  console.log("Starting GitHub repository -> integration migration...");

  await db.execute(sql`
    ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS owner text;
  `);
  await db.execute(sql`
    ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS repo text;
  `);
  await db.execute(sql`
    ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS default_branch text;
  `);
  await db.execute(sql`
    ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS repository_enabled boolean DEFAULT true NOT NULL;
  `);
  await db.execute(sql`
    ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS encrypted_webhook_secret text;
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS githubIntegrations_organization_owner_repo_uidx
    ON github_integrations USING btree (organization_id, owner, repo);
  `);

  const tableResult = await db.execute<{ tableName: string | null }>(sql`
    select to_regclass($$public.github_repositories$$) as "tableName"
  `);

  if (!tableResult.rows[0]?.tableName) {
    console.log(
      "github_repositories table is already removed. Nothing left to migrate."
    );
    return;
  }

  const [integrations, repositoryResult] = await Promise.all([
    db
      .select({ id: schema.githubIntegrations.id })
      .from(schema.githubIntegrations),
    db.execute<LegacyRepository>(sql`
      select
        id,
        integration_id as "integrationId",
        owner,
        repo,
        default_branch as "defaultBranch",
        enabled,
        encrypted_webhook_secret as "encryptedWebhookSecret"
      from github_repositories
    `),
  ]);

  const repositories = repositoryResult.rows;

  if (integrations.length === 0) {
    console.log("No GitHub integrations found. Nothing to migrate.");
    return;
  }

  const repositoriesByIntegrationId = new Map<
    string,
    (typeof repositories)[number][]
  >();

  for (const repository of repositories) {
    const current =
      repositoriesByIntegrationId.get(repository.integrationId) ?? [];
    current.push(repository);
    repositoriesByIntegrationId.set(repository.integrationId, current);
  }

  const multiRepositoryIntegrations: string[] = [];
  const missingRepositoryIntegrations: string[] = [];

  for (const integration of integrations) {
    const relatedRepositories =
      repositoriesByIntegrationId.get(integration.id) ?? [];

    if (relatedRepositories.length > 1) {
      multiRepositoryIntegrations.push(
        `${integration.id} has ${relatedRepositories.length} repositories`
      );
    }

    if (relatedRepositories.length === 0) {
      missingRepositoryIntegrations.push(integration.id);
    }
  }

  if (multiRepositoryIntegrations.length > 0) {
    throw new Error(
      [
        "Migration aborted. Expected at most one repository per integration:",
        formatItems(multiRepositoryIntegrations),
      ].join("\n")
    );
  }

  if (missingRepositoryIntegrations.length > 0) {
    console.warn(
      [
        "Found integrations with no repositories. They will be deleted:",
        formatItems(missingRepositoryIntegrations),
      ].join("\n")
    );
  }

  const missingRepositoryIntegrationIds = new Set(
    missingRepositoryIntegrations
  );
  const integrationsToMigrate = integrations.filter(
    (integration) => !missingRepositoryIntegrationIds.has(integration.id)
  );

  const integrationIdSet = new Set(
    integrationsToMigrate.map((integration) => integration.id)
  );

  const repositoryIdToIntegrationId = new Map<string, string>();
  for (const repository of repositories) {
    repositoryIdToIntegrationId.set(repository.id, repository.integrationId);
  }

  await db.transaction(async (tx) => {
    if (missingRepositoryIntegrations.length > 0) {
      const outputsReferencingMissingIntegrations = await tx
        .select({ id: schema.repositoryOutputs.id })
        .from(schema.repositoryOutputs)
        .where(
          inArray(
            schema.repositoryOutputs.repositoryId,
            missingRepositoryIntegrations
          )
        );

      if (outputsReferencingMissingIntegrations.length > 0) {
        throw new Error(
          [
            "Migration aborted. Missing-repository integrations are referenced by repository_outputs:",
            formatItems(
              outputsReferencingMissingIntegrations.map((row) => row.id)
            ),
          ].join("\n")
        );
      }

      const triggers = await tx
        .select({
          id: schema.contentTriggers.id,
          targets: schema.contentTriggers.targets,
        })
        .from(schema.contentTriggers);

      const triggersReferencingMissingIntegrations = triggers
        .filter((trigger) => {
          const targets = (trigger.targets as TriggerTargets | null) ?? {};
          const repositoryIds = targets.repositoryIds ?? [];
          return repositoryIds.some((id) =>
            missingRepositoryIntegrationIds.has(id)
          );
        })
        .map((trigger) => trigger.id);

      if (triggersReferencingMissingIntegrations.length > 0) {
        throw new Error(
          [
            "Migration aborted. Missing-repository integrations are referenced by content_triggers:",
            formatItems(triggersReferencingMissingIntegrations),
          ].join("\n")
        );
      }

      await tx
        .delete(schema.githubIntegrations)
        .where(
          inArray(schema.githubIntegrations.id, missingRepositoryIntegrations)
        );
    }

    await tx.execute(sql`
      ALTER TABLE repository_outputs
      DROP CONSTRAINT IF EXISTS repository_outputs_repository_id_github_repositories_id_fk
    `);

    for (const integration of integrationsToMigrate) {
      const repository = repositoriesByIntegrationId.get(integration.id)?.[0];

      if (!repository) {
        throw new Error(`Missing repository for integration ${integration.id}`);
      }

      await tx
        .update(schema.githubIntegrations)
        .set({
          owner: repository.owner,
          repo: repository.repo,
          defaultBranch: repository.defaultBranch,
          repositoryEnabled: repository.enabled,
          encryptedWebhookSecret: repository.encryptedWebhookSecret,
        })
        .where(eq(schema.githubIntegrations.id, integration.id));
    }

    const outputs = await tx
      .select({
        id: schema.repositoryOutputs.id,
        repositoryId: schema.repositoryOutputs.repositoryId,
      })
      .from(schema.repositoryOutputs);

    for (const output of outputs) {
      const mappedIntegrationId = repositoryIdToIntegrationId.get(
        output.repositoryId
      );

      if (!mappedIntegrationId) {
        if (integrationIdSet.has(output.repositoryId)) {
          continue;
        }

        throw new Error(
          `Repository output ${output.id} references unknown repository_id ${output.repositoryId}`
        );
      }

      if (mappedIntegrationId === output.repositoryId) {
        continue;
      }

      await tx
        .update(schema.repositoryOutputs)
        .set({ repositoryId: mappedIntegrationId })
        .where(eq(schema.repositoryOutputs.id, output.id));
    }

    const triggers = await tx
      .select({
        id: schema.contentTriggers.id,
        targets: schema.contentTriggers.targets,
      })
      .from(schema.contentTriggers);

    for (const trigger of triggers) {
      const targets = (trigger.targets as TriggerTargets | null) ?? {};
      const repositoryIds = targets.repositoryIds ?? [];

      if (repositoryIds.length === 0) {
        continue;
      }

      const mappedRepositoryIds = repositoryIds.map((repositoryId) => {
        const mappedIntegrationId =
          repositoryIdToIntegrationId.get(repositoryId);

        if (mappedIntegrationId) {
          return mappedIntegrationId;
        }

        if (integrationIdSet.has(repositoryId)) {
          return repositoryId;
        }

        throw new Error(
          `Trigger ${trigger.id} references unknown repository ID ${repositoryId}`
        );
      });

      const dedupedRepositoryIds = [...new Set(mappedRepositoryIds)];

      await tx
        .update(schema.contentTriggers)
        .set({
          targets: {
            ...targets,
            repositoryIds: dedupedRepositoryIds,
          },
        })
        .where(eq(schema.contentTriggers.id, trigger.id));
    }

    await tx.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'repository_outputs_repository_id_github_integrations_id_fk'
        ) THEN
          ALTER TABLE repository_outputs
          ADD CONSTRAINT repository_outputs_repository_id_github_integrations_id_fk
          FOREIGN KEY (repository_id)
          REFERENCES github_integrations(id)
          ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await tx.execute(sql`
      ALTER TABLE github_repositories DISABLE ROW LEVEL SECURITY;
    `);

    await tx.execute(sql`
      DROP TABLE IF EXISTS github_repositories;
    `);
  });

  console.log(`Migrated ${integrationsToMigrate.length} integrations`);
  console.log(
    `Deleted ${missingRepositoryIntegrations.length} integrations with no repository rows`
  );
  console.log(`Re-keyed ${repositories.length} repository IDs`);
  console.log("GitHub migration completed successfully.");
}

migrate().catch((error) => {
  console.error("GitHub migration failed:", error);
  process.exit(1);
});
