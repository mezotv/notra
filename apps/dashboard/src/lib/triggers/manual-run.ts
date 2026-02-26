import { db } from "@notra/db/drizzle";
import { contentTriggers } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { checkLogRetention } from "@/lib/billing/check-log-retention";
import { triggerEventNow, triggerScheduleNow } from "@/lib/triggers/qstash";
import { appendWebhookLog } from "@/lib/webhooks/logging";

type TriggerRecord = {
  id: string;
  organizationId: string;
  sourceType: string;
  sourceConfig: unknown;
  targets: unknown;
  outputType: string;
  name: string | null;
  enabled: boolean;
};

type ManualRunKind = "schedule" | "event";

export class ManualTriggerRunError extends Error {
  status: number;
  code: string;

  constructor(message: string, options: { status: number; code: string }) {
    super(message);
    this.name = "ManualTriggerRunError";
    this.status = options.status;
    this.code = options.code;
  }
}

function getTriggerName(trigger: TriggerRecord) {
  const name = trigger.name?.trim();
  return name || trigger.outputType;
}

function parseEventType(sourceConfig: unknown) {
  if (
    sourceConfig &&
    typeof sourceConfig === "object" &&
    "eventTypes" in sourceConfig
  ) {
    const eventTypes = (sourceConfig as { eventTypes?: unknown }).eventTypes;

    if (Array.isArray(eventTypes) && eventTypes.length > 0) {
      const first = eventTypes[0];
      if (typeof first === "string" && first.length > 0) {
        return first;
      }
    }
  }

  return "release";
}

function parseRepositoryIds(targets: unknown) {
  if (targets && typeof targets === "object" && "repositoryIds" in targets) {
    const repositoryIds = (targets as { repositoryIds?: unknown })
      .repositoryIds;

    if (Array.isArray(repositoryIds)) {
      return repositoryIds.filter(
        (repositoryId): repositoryId is string =>
          typeof repositoryId === "string" && repositoryId.length > 0
      );
    }
  }

  return [];
}

function buildManualEventPayload(trigger: TriggerRecord) {
  const eventType = parseEventType(trigger.sourceConfig);
  const repositoryIds = parseRepositoryIds(trigger.targets);
  const repositoryId = repositoryIds[0];

  if (!repositoryId) {
    throw new ManualTriggerRunError("No repository targets configured", {
      status: 400,
      code: "NO_TARGET_REPOSITORY",
    });
  }

  const eventActionByType: Record<string, string> = {
    release: "published",
    push: "pushed",
  };

  return {
    repositoryId,
    eventType,
    eventAction: eventActionByType[eventType] ?? "manual",
    eventData: {
      manualRun: true,
      triggeredAt: new Date().toISOString(),
      triggerId: trigger.id,
      note: "Manual run from automation events",
    },
  };
}

export async function triggerManualAutomationRun({
  organizationId,
  triggerId,
  triggeredBy,
}: {
  organizationId: string;
  triggerId: string;
  triggeredBy: string;
}) {
  const trigger = await db.query.contentTriggers.findFirst({
    where: and(
      eq(contentTriggers.id, triggerId),
      eq(contentTriggers.organizationId, organizationId)
    ),
  });

  if (!trigger) {
    throw new ManualTriggerRunError("Trigger not found", {
      status: 404,
      code: "TRIGGER_NOT_FOUND",
    });
  }

  if (!trigger.enabled) {
    throw new ManualTriggerRunError(
      trigger.sourceType === "cron"
        ? "Cannot run a disabled schedule"
        : "Cannot run a disabled trigger",
      {
        status: 400,
        code: "TRIGGER_DISABLED",
      }
    );
  }

  const triggerName = getTriggerName(trigger);

  let workflowRunId: string;
  let kind: ManualRunKind;
  let payload: Record<string, unknown>;

  if (trigger.sourceType === "cron") {
    kind = "schedule";
    workflowRunId = await triggerScheduleNow(triggerId, { manual: true });
    payload = {
      triggerId,
      scheduleName: triggerName,
      sourceType: trigger.sourceType,
      outputType: trigger.outputType,
      workflowRunId,
      triggeredBy,
    };
  } else if (trigger.sourceType === "github_webhook") {
    kind = "event";
    const eventPayload = buildManualEventPayload(trigger);
    workflowRunId = await triggerEventNow({
      triggerId,
      repositoryId: eventPayload.repositoryId,
      eventType: eventPayload.eventType,
      eventAction: eventPayload.eventAction,
      eventData: eventPayload.eventData,
    });
    payload = {
      triggerId,
      sourceType: trigger.sourceType,
      outputType: trigger.outputType,
      workflowRunId,
      triggeredBy,
      repositoryId: eventPayload.repositoryId,
      eventType: eventPayload.eventType,
      eventAction: eventPayload.eventAction,
      manualRun: true,
    };
  } else {
    throw new ManualTriggerRunError(
      `Manual runs are not supported for source type '${trigger.sourceType}'`,
      {
        status: 400,
        code: "UNSUPPORTED_SOURCE_TYPE",
      }
    );
  }

  const logRetentionDays = await checkLogRetention(organizationId);

  await appendWebhookLog({
    organizationId,
    integrationId: triggerId,
    integrationType: "manual",
    title: triggerName,
    status: "success",
    statusCode: 200,
    referenceId: workflowRunId,
    payload,
    retentionDays: logRetentionDays,
  });

  return {
    kind,
    workflowRunId,
  };
}
