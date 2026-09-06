import type { createDb } from "@notra/db/drizzle";
import { contentTriggers } from "@notra/db/schema";
import { and, eq, inArray } from "drizzle-orm";

import { logError } from "./logging";
import { deleteQstashSchedule } from "./qstash";

type DbClient = ReturnType<typeof createDb>;
type DbTransaction = Parameters<Parameters<DbClient["transaction"]>[0]>[0];

export type IntegrationTrigger = Awaited<
  ReturnType<typeof getTriggersForIntegration>
>[number];

export async function getTriggersForBrandIdentity(
  db: DbClient,
  organizationId: string,
  brandIdentityId: string
) {
  const allTriggers = await db.query.contentTriggers.findMany({
    where: eq(contentTriggers.organizationId, organizationId),
    columns: {
      id: true,
      name: true,
      sourceType: true,
      outputConfig: true,
      qstashScheduleId: true,
    },
  });

  return allTriggers.filter((trigger) => {
    const config = trigger.outputConfig as {
      brandVoiceId?: string;
    } | null;

    return config?.brandVoiceId === brandIdentityId;
  });
}

export async function getTriggersForIntegration(
  db: DbClient,
  organizationId: string,
  integrationId: string
) {
  // Triggers currently persist both GitHub integration IDs and Linear selections
  // inside targets.repositoryIds. Linear values are stored with a `linear:` prefix.
  const allTriggers = await db.query.contentTriggers.findMany({
    where: eq(contentTriggers.organizationId, organizationId),
    columns: {
      id: true,
      name: true,
      sourceType: true,
      targets: true,
      qstashScheduleId: true,
    },
  });

  return allTriggers.filter((trigger) => {
    const targets = trigger.targets as
      | {
          repositoryIds?: string[];
        }
      | undefined;

    if (!targets?.repositoryIds?.length) {
      return false;
    }

    return targets.repositoryIds.some(
      (targetId) =>
        targetId === integrationId || targetId === `linear:${integrationId}`
    );
  });
}

export async function disableTriggersAndDeleteIntegration(
  db: DbClient,
  organizationId: string,
  affectedTriggers: IntegrationTrigger[],
  deleteIntegration: (tx: DbTransaction) => Promise<unknown>
) {
  await db.transaction(async (tx) => {
    if (affectedTriggers.length > 0) {
      await tx
        .update(contentTriggers)
        .set({
          enabled: false,
          qstashScheduleId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(contentTriggers.organizationId, organizationId),
            inArray(
              contentTriggers.id,
              affectedTriggers.map((trigger) => trigger.id)
            )
          )
        );
    }

    await deleteIntegration(tx);
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableDeleteError(error: unknown) {
  // deleteQstashSchedule throws `...: <status> <body>` for HTTP failures and
  // plain Errors for missing config/network failures. Only retry timeouts,
  // rate limits, 5xx, and network failures — 401/403/400 will never succeed.
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("not configured")) {
    return false;
  }
  const match = message.match(/:\s(\d{3})\b/);
  if (!match) {
    return true;
  }
  const status = Number(match[1]);
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export async function deleteQstashScheduleWithRetry(
  runtimeEnv: { QSTASH_TOKEN?: string; WORKFLOW_BASE_URL?: string },
  scheduleId: string,
  attempts = 3
) {
  const totalAttempts = Math.max(1, Math.floor(attempts));
  let lastError: unknown = new Error(
    `Failed to delete QStash schedule ${scheduleId}`
  );

  for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
    try {
      await deleteQstashSchedule(runtimeEnv, scheduleId);
      return;
    } catch (error) {
      lastError = error;

      if (attempt >= totalAttempts || !isRetryableDeleteError(error)) {
        throw error;
      }

      await delay(200 * attempt);
    }
  }

  throw lastError;
}

export async function deleteQstashSchedulesForTriggers(
  runtimeEnv: { QSTASH_TOKEN?: string; WORKFLOW_BASE_URL?: string },
  affectedTriggers: readonly { qstashScheduleId: string | null }[]
) {
  for (const trigger of affectedTriggers) {
    if (!trigger.qstashScheduleId) {
      continue;
    }

    try {
      await deleteQstashScheduleWithRetry(runtimeEnv, trigger.qstashScheduleId);
    } catch (error) {
      logError(
        `Failed to delete qstash schedule ${trigger.qstashScheduleId}`,
        error
      );
    }
  }
}
