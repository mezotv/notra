import crypto from "node:crypto";
import { db } from "@notra/db/drizzle";
import {
  contentTriggerLookbackWindows,
  contentTriggers,
  githubIntegrations,
} from "@notra/db/schema";
import { and, eq, inArray, ne } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withOrganizationAuth } from "@/lib/auth/organization";
import {
  buildCronExpression,
  createQstashSchedule,
  deleteQstashSchedule,
} from "@/lib/triggers/qstash";
import {
  configureScheduleBodySchema,
  getSchedulesQuerySchema,
  type LookbackWindow,
  triggerTargetsSchema,
} from "@/schemas/integrations";
import type { Trigger } from "@/types/lib/triggers/triggers";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 16);
const DEFAULT_LOOKBACK_WINDOW: LookbackWindow = "last_7_days";
const DEFAULT_SCHEDULE_NAME = "Untitled Schedule";

function toEffectiveLookbackWindow(
  lookbackWindow?: LookbackWindow | null
): LookbackWindow {
  return lookbackWindow ?? DEFAULT_LOOKBACK_WINDOW;
}

interface RouteContext {
  params: Promise<{ organizationId: string }>;
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

  return {
    sourceConfig: {
      ...sourceConfig,
      eventTypes,
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
  lookbackWindow: LookbackWindow;
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

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = getSchedulesQuerySchema.safeParse({
      repositoryIds: searchParams.getAll("repositoryId"),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: queryValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const triggers = await db.query.contentTriggers.findMany({
      where: and(
        eq(contentTriggers.organizationId, organizationId),
        eq(contentTriggers.sourceType, "cron")
      ),
      orderBy: (items, { desc }) => [desc(items.createdAt)],
    });

    const triggerIds = triggers.map((trigger) => trigger.id);
    const lookbackWindows =
      triggerIds.length > 0
        ? await db.query.contentTriggerLookbackWindows.findMany({
            where: inArray(contentTriggerLookbackWindows.triggerId, triggerIds),
          })
        : [];

    const lookbackWindowByTriggerId = new Map(
      lookbackWindows.map((item) => [
        item.triggerId,
        item.window as LookbackWindow,
      ])
    );

    const repositoryIds = queryValidation.data.repositoryIds?.filter(Boolean);
    const repositoryIdSet = repositoryIds ? new Set(repositoryIds) : null;
    const filteredTriggers =
      repositoryIdSet && repositoryIdSet.size > 0
        ? triggers.filter((trigger) => {
            const parsedTargets = triggerTargetsSchema.safeParse(
              trigger.targets
            );
            if (!parsedTargets.success) {
              return false;
            }
            return parsedTargets.data.repositoryIds.some((repositoryId) =>
              repositoryIdSet.has(repositoryId)
            );
          })
        : triggers;

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
            })
            .from(githubIntegrations)
            .where(inArray(githubIntegrations.id, allRepositoryIds))
        : [];

    const repositoryMap = Object.fromEntries(
      repositories
        .filter((repository) => repository.owner && repository.repo)
        .map((repository) => [
          repository.id,
          `${repository.owner}/${repository.repo}`,
        ])
    );

    return NextResponse.json({
      triggers: triggersWithLookback,
      repositoryMap,
    });
  } catch (error) {
    console.error("Error fetching automation schedules:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const body = await request.json();
    const bodyValidation = configureScheduleBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: bodyValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      name,
      sourceType,
      sourceConfig,
      targets,
      outputType,
      outputConfig,
      enabled,
      lookbackWindow,
    } = bodyValidation.data;

    const normalized = normalizeTriggerConfig({ sourceConfig, targets });
    const dedupeHash = hashTrigger({
      sourceType,
      sourceConfig: normalized.sourceConfig,
      targets: normalized.targets,
      outputType,
      lookbackWindow,
    });

    const existing = await db.query.contentTriggers.findFirst({
      where: and(
        eq(contentTriggers.organizationId, organizationId),
        eq(contentTriggers.dedupeHash, dedupeHash)
      ),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate trigger", code: "DUPLICATE_TRIGGER" },
        { status: 409 }
      );
    }

    const triggerId = nanoid();
    const cronExpression = buildCronExpression(sourceConfig.cron);
    let qstashScheduleId: string | null = null;
    const persistedLookbackWindow = lookbackWindow;
    const persistedName = name?.trim() || DEFAULT_SCHEDULE_NAME;

    if (cronExpression) {
      qstashScheduleId = await createQstashSchedule({
        triggerId,
        cron: cronExpression,
      });
    }

    try {
      const trigger = await db.transaction(async (tx) => {
        const [createdTrigger] = await tx
          .insert(contentTriggers)
          .values({
            id: triggerId,
            organizationId,
            name: persistedName,
            sourceType,
            sourceConfig: normalized.sourceConfig,
            targets: normalized.targets,
            outputType,
            outputConfig: outputConfig ?? null,
            dedupeHash,
            enabled,
            qstashScheduleId,
          })
          .returning();

        await tx.insert(contentTriggerLookbackWindows).values({
          triggerId,
          window: persistedLookbackWindow,
        });

        return {
          ...createdTrigger,
          lookbackWindow: persistedLookbackWindow,
        };
      });

      return NextResponse.json({ trigger });
    } catch (dbError) {
      if (qstashScheduleId) {
        await deleteQstashSchedule(qstashScheduleId).catch((error) => {
          console.error("Error deleting schedule:", error);
        });
      }

      await db
        .delete(contentTriggers)
        .where(
          and(
            eq(contentTriggers.id, triggerId),
            eq(contentTriggers.organizationId, organizationId)
          )
        )
        .catch((error) => {
          console.error("Error deleting trigger:", error);
        });

      throw dbError;
    }
  } catch (error) {
    console.error("Error creating automation schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const triggerId = searchParams.get("triggerId");
    if (!triggerId) {
      return NextResponse.json(
        { error: "Trigger ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const bodyValidation = configureScheduleBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: bodyValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      name,
      sourceType,
      sourceConfig,
      targets,
      outputType,
      outputConfig,
      enabled,
      lookbackWindow,
    } = bodyValidation.data;

    const normalized = normalizeTriggerConfig({ sourceConfig, targets });
    const dedupeHash = hashTrigger({
      sourceType,
      sourceConfig: normalized.sourceConfig,
      targets: normalized.targets,
      outputType,
      lookbackWindow,
    });

    const duplicate = await db.query.contentTriggers.findFirst({
      where: and(
        eq(contentTriggers.organizationId, organizationId),
        eq(contentTriggers.dedupeHash, dedupeHash),
        ne(contentTriggers.id, triggerId)
      ),
    });

    if (duplicate) {
      return NextResponse.json(
        { error: "Duplicate trigger", code: "DUPLICATE_TRIGGER" },
        { status: 409 }
      );
    }

    const existing = await db.query.contentTriggers.findFirst({
      where: and(
        eq(contentTriggers.id, triggerId),
        eq(contentTriggers.organizationId, organizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const existingScheduleId = existing.qstashScheduleId ?? null;
    const cronExpression = buildCronExpression(sourceConfig.cron);
    let qstashScheduleId: string | null = null;
    const persistedLookbackWindow = lookbackWindow;
    const persistedName =
      name?.trim() || existing.name || DEFAULT_SCHEDULE_NAME;

    if (cronExpression) {
      qstashScheduleId = await createQstashSchedule({
        triggerId,
        cron: cronExpression,
        scheduleId: existingScheduleId ?? undefined,
      });
    }

    try {
      const trigger = await db.transaction(async (tx) => {
        const [updatedTrigger] = await tx
          .update(contentTriggers)
          .set({
            name: persistedName,
            sourceType,
            sourceConfig: normalized.sourceConfig,
            targets: normalized.targets,
            outputType,
            outputConfig: outputConfig ?? null,
            dedupeHash,
            enabled,
            qstashScheduleId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(contentTriggers.id, triggerId),
              eq(contentTriggers.organizationId, organizationId)
            )
          )
          .returning();

        await tx
          .insert(contentTriggerLookbackWindows)
          .values({
            triggerId,
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

      return NextResponse.json({ trigger });
    } catch (dbError) {
      if (qstashScheduleId && qstashScheduleId !== existingScheduleId) {
        await deleteQstashSchedule(qstashScheduleId).catch((error) => {
          console.error("Error deleting schedule:", error);
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error updating automation schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { organizationId } = await params;
    const auth = await withOrganizationAuth(request, organizationId);

    if (!auth.success) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const triggerId = searchParams.get("triggerId");
    if (!triggerId) {
      return NextResponse.json(
        { error: "Trigger ID required" },
        { status: 400 }
      );
    }

    const existing = await db.query.contentTriggers.findFirst({
      where: and(
        eq(contentTriggers.id, triggerId),
        eq(contentTriggers.organizationId, organizationId)
      ),
    });

    if (!existing) {
      return NextResponse.json({ success: true });
    }

    if (existing.qstashScheduleId) {
      await deleteQstashSchedule(existing.qstashScheduleId);
    }

    await db
      .delete(contentTriggers)
      .where(
        and(
          eq(contentTriggers.id, triggerId),
          eq(contentTriggers.organizationId, organizationId)
        )
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting automation schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
