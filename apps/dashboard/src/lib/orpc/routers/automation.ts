import crypto from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  contentTriggerLookbackWindows,
  contentTriggers,
  githubIntegrations,
} from "@notra/db/schema";
import { and, eq, inArray, ne } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { DEFAULT_LOOKBACK_WINDOW } from "@/constants/workflows";
import { assertOrganizationAccess } from "@/lib/auth/organization";
import { baseProcedure } from "@/lib/orpc/base";
import {
  ManualTriggerRunError,
  triggerManualAutomationRun,
} from "@/lib/triggers/manual-run";
import {
  buildCronExpression,
  createQstashSchedule,
  deleteQstashSchedule,
  normalizeCronConfig,
} from "@/lib/triggers/qstash";
import {
  configureScheduleBodySchema,
  configureTriggerBodySchema,
  getSchedulesQuerySchema,
  type LookbackWindow,
  triggerTargetsSchema,
} from "@/schemas/integrations";
import type { Trigger } from "@/types/triggers/triggers";
import {
  badRequest,
  conflict,
  internalServerError,
  notFound,
} from "../utils/errors";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
const DEFAULT_SCHEDULE_NAME = "Untitled Schedule";

const organizationIdInputSchema = z.object({
  organizationId: z.string().min(1, "Organization ID is required"),
});

const triggerInputSchema = organizationIdInputSchema.extend({
  triggerId: z.string().min(1, "Trigger ID is required"),
});

const schedulesListInputSchema = organizationIdInputSchema.and(
  getSchedulesQuerySchema
);

function toEffectiveLookbackWindow(
  lookbackWindow?: LookbackWindow | null
): LookbackWindow {
  return lookbackWindow ?? DEFAULT_LOOKBACK_WINDOW;
}

function normalizeTriggerConfig({
  sourceConfig,
  targets,
}: {
  sourceConfig: Trigger["sourceConfig"];
  targets: Trigger["targets"];
}) {
  const eventTypes = sourceConfig.eventTypes
    ? [...sourceConfig.eventTypes].sort()
    : sourceConfig.eventTypes;
  const repositoryIds = [...targets.repositoryIds].sort();
  const cron = normalizeCronConfig(sourceConfig.cron);

  return {
    sourceConfig: {
      ...sourceConfig,
      eventTypes,
      cron,
    },
    targets: {
      repositoryIds,
    },
  };
}

function hashTrigger({
  sourceType,
  sourceConfig,
  targets,
  outputType,
  lookbackWindow,
}: {
  sourceType: string;
  sourceConfig: Trigger["sourceConfig"];
  targets: Trigger["targets"];
  outputType: string;
  lookbackWindow?: LookbackWindow;
}) {
  const normalized = normalizeTriggerConfig({ sourceConfig, targets });
  const payload = JSON.stringify({
    sourceType,
    sourceConfig: normalized.sourceConfig,
    targets: normalized.targets,
    outputType,
    lookbackWindow,
  });

  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function ensureTriggerInOrganization(
  organizationId: string,
  triggerId: string
) {
  const trigger = await db.query.contentTriggers.findFirst({
    where: and(
      eq(contentTriggers.id, triggerId),
      eq(contentTriggers.organizationId, organizationId)
    ),
  });

  if (!trigger) {
    throw notFound("Schedule not found");
  }

  return trigger;
}

async function ensureScheduleTargetsExist(
  organizationId: string,
  repositoryIds: string[],
  message: string
) {
  if (repositoryIds.length === 0) {
    return;
  }

  const targetIntegrations = await db.query.githubIntegrations.findMany({
    where: and(
      eq(githubIntegrations.organizationId, organizationId),
      inArray(githubIntegrations.id, repositoryIds)
    ),
    columns: { id: true },
  });

  const existingIds = new Set(
    targetIntegrations.map((integration) => integration.id)
  );
  const missingIds = repositoryIds.filter((id) => !existingIds.has(id));

  if (missingIds.length > 0) {
    throw badRequest(message, {
      code: "INTEGRATION_NOT_FOUND",
      missingIntegrationIds: missingIds,
    });
  }
}

function mapQstashError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Unknown error";

  if (
    message.includes("invalid destination") ||
    message.includes("unable to resolve host")
  ) {
    throw badRequest("External URL not configured", {
      code: "INVALID_DESTINATION_URL",
    });
  }

  throw error;
}

function filterTriggersByRepositoryIds<TTrigger extends { targets: unknown }>(
  triggers: TTrigger[],
  repositoryIds?: string[]
) {
  const normalizedRepositoryIds = repositoryIds?.filter(Boolean);

  if (!normalizedRepositoryIds || normalizedRepositoryIds.length === 0) {
    return triggers;
  }

  const repositoryIdSet = new Set(normalizedRepositoryIds);

  return triggers.filter((trigger) => {
    const parsedTargets = triggerTargetsSchema.safeParse(trigger.targets);

    if (!parsedTargets.success) {
      return false;
    }

    return parsedTargets.data.repositoryIds.some((repositoryId) =>
      repositoryIdSet.has(repositoryId)
    );
  });
}

function serializeTrigger(trigger: {
  id: string;
  organizationId: string;
  name: string;
  sourceType: string;
  sourceConfig: unknown;
  targets: unknown;
  outputType: string;
  outputConfig: unknown;
  enabled: boolean;
  autoPublish: boolean;
  createdAt: Date;
  updatedAt: Date;
  lookbackWindow?: LookbackWindow;
}): Trigger {
  return {
    id: trigger.id,
    organizationId: trigger.organizationId,
    name: trigger.name,
    sourceType: trigger.sourceType as Trigger["sourceType"],
    sourceConfig: trigger.sourceConfig as Trigger["sourceConfig"],
    targets: trigger.targets as Trigger["targets"],
    outputType: trigger.outputType as Trigger["outputType"],
    outputConfig: trigger.outputConfig as Trigger["outputConfig"],
    enabled: trigger.enabled,
    autoPublish: trigger.autoPublish,
    createdAt: trigger.createdAt.toISOString(),
    updatedAt: trigger.updatedAt.toISOString(),
    ...(trigger.lookbackWindow
      ? { lookbackWindow: trigger.lookbackWindow }
      : {}),
  };
}

export const automationRouter = {
  events: {
    list: baseProcedure
      .input(schedulesListInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const triggers = await db.query.contentTriggers.findMany({
          where: and(
            eq(contentTriggers.organizationId, input.organizationId),
            eq(contentTriggers.sourceType, "github_webhook")
          ),
          orderBy: (items, { desc }) => [desc(items.createdAt)],
        });

        return {
          triggers: filterTriggersByRepositoryIds(
            triggers,
            input.repositoryIds
          ).map(serializeTrigger),
        };
      }),
    create: baseProcedure
      .input(organizationIdInputSchema.and(configureTriggerBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        if (input.sourceType !== "github_webhook") {
          throw badRequest("Only event triggers are supported here");
        }

        const normalized = normalizeTriggerConfig({
          sourceConfig: input.sourceConfig,
          targets: input.targets,
        });
        const dedupeHash = hashTrigger({
          sourceType: input.sourceType,
          sourceConfig: normalized.sourceConfig,
          targets: normalized.targets,
          outputType: input.outputType,
        });

        const existing = await db.query.contentTriggers.findFirst({
          where: and(
            eq(contentTriggers.organizationId, input.organizationId),
            eq(contentTriggers.dedupeHash, dedupeHash)
          ),
        });

        if (existing) {
          throw conflict("Duplicate trigger", { code: "DUPLICATE_TRIGGER" });
        }

        const [trigger] = await db
          .insert(contentTriggers)
          .values({
            id: nanoid(),
            organizationId: input.organizationId,
            sourceType: input.sourceType,
            sourceConfig: normalized.sourceConfig,
            targets: normalized.targets,
            outputType: input.outputType,
            outputConfig: input.outputConfig ?? null,
            dedupeHash,
            enabled: input.enabled,
            autoPublish: input.autoPublish,
          })
          .returning();

        if (!trigger) {
          throw internalServerError("Failed to create trigger");
        }

        return { trigger: serializeTrigger(trigger) };
      }),
    update: baseProcedure
      .input(triggerInputSchema.and(configureTriggerBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        if (input.sourceType !== "github_webhook") {
          throw badRequest("Only event triggers are supported here");
        }

        const existing = await ensureTriggerInOrganization(
          input.organizationId,
          input.triggerId
        );

        const normalized = normalizeTriggerConfig({
          sourceConfig: input.sourceConfig,
          targets: input.targets,
        });
        const dedupeHash = hashTrigger({
          sourceType: input.sourceType,
          sourceConfig: normalized.sourceConfig,
          targets: normalized.targets,
          outputType: input.outputType,
        });

        const duplicate = await db.query.contentTriggers.findFirst({
          where: and(
            eq(contentTriggers.organizationId, input.organizationId),
            eq(contentTriggers.dedupeHash, dedupeHash),
            ne(contentTriggers.id, input.triggerId)
          ),
        });

        if (duplicate) {
          throw conflict("Duplicate trigger", { code: "DUPLICATE_TRIGGER" });
        }

        const previousQstashScheduleId = existing.qstashScheduleId;

        const [trigger] = await db
          .update(contentTriggers)
          .set({
            sourceType: input.sourceType,
            sourceConfig: normalized.sourceConfig,
            targets: normalized.targets,
            outputType: input.outputType,
            outputConfig: input.outputConfig ?? null,
            dedupeHash,
            enabled: input.enabled,
            autoPublish: input.autoPublish,
            qstashScheduleId: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(contentTriggers.id, input.triggerId),
              eq(contentTriggers.organizationId, input.organizationId)
            )
          )
          .returning();

        if (previousQstashScheduleId) {
          await deleteQstashSchedule(previousQstashScheduleId).catch(
            (error) => {
              console.error("Error deleting schedule:", error);
            }
          );
        }

        if (!trigger) {
          throw internalServerError("Failed to update trigger");
        }

        return { trigger: serializeTrigger(trigger) };
      }),
    delete: baseProcedure
      .input(triggerInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await db.query.contentTriggers.findFirst({
          where: and(
            eq(contentTriggers.id, input.triggerId),
            eq(contentTriggers.organizationId, input.organizationId)
          ),
        });

        if (!existing) {
          return { success: true };
        }

        if (existing.qstashScheduleId) {
          await deleteQstashSchedule(existing.qstashScheduleId);
        }

        await db
          .delete(contentTriggers)
          .where(
            and(
              eq(contentTriggers.id, input.triggerId),
              eq(contentTriggers.organizationId, input.organizationId)
            )
          );

        return { success: true };
      }),
  },
  schedules: {
    list: baseProcedure
      .input(schedulesListInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const triggers = await db.query.contentTriggers.findMany({
          where: and(
            eq(contentTriggers.organizationId, input.organizationId),
            eq(contentTriggers.sourceType, "cron")
          ),
          orderBy: (items, { desc }) => [desc(items.createdAt)],
        });

        const triggerIds = triggers.map((trigger) => trigger.id);
        const lookbackWindows =
          triggerIds.length > 0
            ? await db.query.contentTriggerLookbackWindows.findMany({
                where: inArray(
                  contentTriggerLookbackWindows.triggerId,
                  triggerIds
                ),
              })
            : [];

        const lookbackWindowByTriggerId = new Map(
          lookbackWindows.map((item) => [
            item.triggerId,
            item.window as LookbackWindow,
          ])
        );

        const filteredTriggers = filterTriggersByRepositoryIds(
          triggers,
          input.repositoryIds
        );

        const triggersWithLookback = filteredTriggers.map((trigger) => ({
          ...trigger,
          lookbackWindow: toEffectiveLookbackWindow(
            lookbackWindowByTriggerId.get(trigger.id)
          ),
        }));

        const allRepositoryIds = [
          ...new Set(
            triggersWithLookback.flatMap((trigger) => {
              const parsed = triggerTargetsSchema.safeParse(trigger.targets);
              return parsed.success ? parsed.data.repositoryIds : [];
            })
          ),
        ];

        const repositories =
          allRepositoryIds.length > 0
            ? await db
                .select({
                  id: githubIntegrations.id,
                  owner: githubIntegrations.owner,
                  repo: githubIntegrations.repo,
                  defaultBranch: githubIntegrations.defaultBranch,
                })
                .from(githubIntegrations)
                .where(inArray(githubIntegrations.id, allRepositoryIds))
            : [];

        const repositoryMap = Object.fromEntries(
          repositories
            .filter((repository) => repository.owner && repository.repo)
            .map((repository) => [
              repository.id,
              repository.defaultBranch?.trim()
                ? `${repository.owner}/${repository.repo} · ${repository.defaultBranch.trim()}`
                : `${repository.owner}/${repository.repo}`,
            ])
        );

        return {
          triggers: triggersWithLookback.map(serializeTrigger),
          repositoryMap,
        };
      }),
    create: baseProcedure
      .input(organizationIdInputSchema.and(configureScheduleBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const normalized = normalizeTriggerConfig({
          sourceConfig: input.sourceConfig,
          targets: input.targets,
        });
        const dedupeHash = hashTrigger({
          sourceType: input.sourceType,
          sourceConfig: normalized.sourceConfig,
          targets: normalized.targets,
          outputType: input.outputType,
          lookbackWindow: input.lookbackWindow,
        });

        const existing = await db.query.contentTriggers.findFirst({
          where: and(
            eq(contentTriggers.organizationId, input.organizationId),
            eq(contentTriggers.dedupeHash, dedupeHash)
          ),
        });

        if (existing) {
          throw conflict("Duplicate trigger", { code: "DUPLICATE_TRIGGER" });
        }

        if (input.enabled === true) {
          await ensureScheduleTargetsExist(
            input.organizationId,
            normalized.targets.repositoryIds,
            "Cannot create enabled schedule: one or more integrations not found"
          );
        }

        const triggerId = nanoid();
        const cronExpression = buildCronExpression(input.sourceConfig.cron);
        let qstashScheduleId: string | null = null;
        const persistedLookbackWindow = input.lookbackWindow;
        const persistedName = input.name.trim() || DEFAULT_SCHEDULE_NAME;

        if (cronExpression) {
          try {
            qstashScheduleId = await createQstashSchedule({
              triggerId,
              cron: cronExpression,
            });
          } catch (error) {
            mapQstashError(error);
          }
        }

        try {
          const trigger = await db.transaction(async (tx) => {
            const [createdTrigger] = await tx
              .insert(contentTriggers)
              .values({
                id: triggerId,
                organizationId: input.organizationId,
                name: persistedName,
                sourceType: input.sourceType,
                sourceConfig: normalized.sourceConfig,
                targets: normalized.targets,
                outputType: input.outputType,
                outputConfig: input.outputConfig ?? null,
                dedupeHash,
                enabled: input.enabled,
                autoPublish: input.autoPublish,
                qstashScheduleId,
              })
              .returning();

            if (!createdTrigger) {
              throw internalServerError("Failed to create schedule");
            }

            await tx.insert(contentTriggerLookbackWindows).values({
              triggerId,
              window: persistedLookbackWindow,
            });

            return {
              ...createdTrigger,
              lookbackWindow: persistedLookbackWindow,
            };
          });

          return { trigger: serializeTrigger(trigger) };
        } catch (error) {
          if (qstashScheduleId) {
            await deleteQstashSchedule(qstashScheduleId).catch(
              (cleanupError) => {
                console.error("Error deleting schedule:", cleanupError);
              }
            );
          }

          await db
            .delete(contentTriggers)
            .where(
              and(
                eq(contentTriggers.id, triggerId),
                eq(contentTriggers.organizationId, input.organizationId)
              )
            )
            .catch((cleanupError) => {
              console.error("Error deleting trigger:", cleanupError);
            });

          throw internalServerError("Internal server error", error);
        }
      }),
    update: baseProcedure
      .input(triggerInputSchema.and(configureScheduleBodySchema))
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const normalized = normalizeTriggerConfig({
          sourceConfig: input.sourceConfig,
          targets: input.targets,
        });
        const dedupeHash = hashTrigger({
          sourceType: input.sourceType,
          sourceConfig: normalized.sourceConfig,
          targets: normalized.targets,
          outputType: input.outputType,
          lookbackWindow: input.lookbackWindow,
        });

        const duplicate = await db.query.contentTriggers.findFirst({
          where: and(
            eq(contentTriggers.organizationId, input.organizationId),
            eq(contentTriggers.dedupeHash, dedupeHash),
            ne(contentTriggers.id, input.triggerId)
          ),
        });

        if (duplicate) {
          throw conflict("Duplicate trigger", { code: "DUPLICATE_TRIGGER" });
        }

        const existing = await db.query.contentTriggers.findFirst({
          where: and(
            eq(contentTriggers.id, input.triggerId),
            eq(contentTriggers.organizationId, input.organizationId)
          ),
        });

        if (!existing) {
          throw notFound("Schedule not found");
        }

        if (input.enabled === true) {
          await ensureScheduleTargetsExist(
            input.organizationId,
            normalized.targets.repositoryIds,
            "Cannot enable schedule: one or more integrations have been deleted"
          );
        }

        const existingScheduleId = existing.qstashScheduleId ?? null;
        const cronExpression = buildCronExpression(input.sourceConfig.cron);
        let qstashScheduleId: string | null = null;
        const persistedLookbackWindow = input.lookbackWindow;
        const persistedName =
          input.name.trim() || existing.name || DEFAULT_SCHEDULE_NAME;

        if (cronExpression) {
          try {
            qstashScheduleId = await createQstashSchedule({
              triggerId: input.triggerId,
              cron: cronExpression,
              scheduleId: existingScheduleId ?? undefined,
            });
          } catch (error) {
            mapQstashError(error);
          }
        }

        try {
          const trigger = await db.transaction(async (tx) => {
            const [updatedTrigger] = await tx
              .update(contentTriggers)
              .set({
                name: persistedName,
                sourceType: input.sourceType,
                sourceConfig: normalized.sourceConfig,
                targets: normalized.targets,
                outputType: input.outputType,
                outputConfig: input.outputConfig ?? null,
                dedupeHash,
                enabled: input.enabled,
                autoPublish: input.autoPublish,
                qstashScheduleId,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(contentTriggers.id, input.triggerId),
                  eq(contentTriggers.organizationId, input.organizationId)
                )
              )
              .returning();

            if (!updatedTrigger) {
              throw internalServerError("Failed to update schedule");
            }

            await tx
              .insert(contentTriggerLookbackWindows)
              .values({
                triggerId: input.triggerId,
                window: persistedLookbackWindow,
              })
              .onConflictDoUpdate({
                target: contentTriggerLookbackWindows.triggerId,
                set: {
                  window: persistedLookbackWindow,
                  updatedAt: new Date(),
                },
              });

            return {
              ...updatedTrigger,
              lookbackWindow: persistedLookbackWindow,
            };
          });

          return { trigger: serializeTrigger(trigger) };
        } catch (error) {
          if (qstashScheduleId && qstashScheduleId !== existingScheduleId) {
            await deleteQstashSchedule(qstashScheduleId).catch(
              (cleanupError) => {
                console.error("Error deleting schedule:", cleanupError);
              }
            );
          }

          throw internalServerError("Internal server error", error);
        }
      }),
    delete: baseProcedure
      .input(triggerInputSchema)
      .handler(async ({ context, input }) => {
        await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        const existing = await db.query.contentTriggers.findFirst({
          where: and(
            eq(contentTriggers.id, input.triggerId),
            eq(contentTriggers.organizationId, input.organizationId)
          ),
        });

        if (!existing) {
          return { success: true };
        }

        if (existing.qstashScheduleId) {
          await deleteQstashSchedule(existing.qstashScheduleId);
        }

        await db
          .delete(contentTriggers)
          .where(
            and(
              eq(contentTriggers.id, input.triggerId),
              eq(contentTriggers.organizationId, input.organizationId)
            )
          );

        return { success: true };
      }),
    runNow: baseProcedure
      .input(triggerInputSchema)
      .handler(async ({ context, input }) => {
        const auth = await assertOrganizationAccess({
          headers: context.headers,
          organizationId: input.organizationId,
        });

        try {
          const { workflowRunId } = await triggerManualAutomationRun({
            organizationId: input.organizationId,
            triggerId: input.triggerId,
            triggeredBy: auth.user.id,
          });

          return {
            success: true,
            workflowRunId,
            message: "Schedule triggered successfully",
          };
        } catch (error) {
          if (error instanceof ManualTriggerRunError) {
            throw badRequest(error.message, { code: error.code });
          }

          throw internalServerError("Failed to trigger schedule", error);
        }
      }),
  },
};
