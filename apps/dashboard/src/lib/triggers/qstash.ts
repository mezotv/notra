import { Client as QStashClient } from "@upstash/qstash";
import { Client as WorkflowClient } from "@upstash/workflow";
import type { EventWorkflowPayload } from "@/schemas/workflows";
import type {
  CreateQstashScheduleProps,
  WorkflowDelay,
} from "@/types/triggers/qstash";
import type { TriggerSourceConfig } from "@/types/triggers/triggers";
import { getConfiguredAppUrl, requireConfiguredAppUrl } from "@/utils/url";

function getQstashToken() {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }
  return token;
}

export function getAppUrl() {
  return requireConfiguredAppUrl();
}

export function getBaseUrl() {
  return getConfiguredAppUrl();
}

function getQStashClient() {
  return new QStashClient({ token: getQstashToken() });
}

function getWorkflowClient() {
  return new WorkflowClient({ token: getQstashToken() });
}

export function buildCronExpression(config?: TriggerSourceConfig["cron"]) {
  const normalizedConfig = normalizeCronConfig(config);

  if (!normalizedConfig) {
    return null;
  }

  const minute = normalizedConfig.minute;
  const hour = normalizedConfig.hour;

  if (normalizedConfig.frequency === "weekly") {
    const dayOfWeek =
      "dayOfWeek" in normalizedConfig ? normalizedConfig.dayOfWeek : 1;
    return `${minute} ${hour} * * ${dayOfWeek}`;
  }

  if (normalizedConfig.frequency === "monthly") {
    const dayOfMonth =
      "dayOfMonth" in normalizedConfig ? normalizedConfig.dayOfMonth : 1;
    return `${minute} ${hour} ${dayOfMonth} * *`;
  }

  return `${minute} ${hour} * * *`;
}

export function normalizeCronConfig(config?: TriggerSourceConfig["cron"]) {
  if (!config) {
    return undefined;
  }

  const base = {
    frequency: config.frequency,
    hour: config.hour ?? 0,
    minute: config.minute ?? 0,
  } as const;

  if (config.frequency === "weekly") {
    return {
      ...base,
      dayOfWeek: config.dayOfWeek ?? 1,
    };
  }

  if (config.frequency === "monthly") {
    return {
      ...base,
      dayOfMonth: config.dayOfMonth ?? 1,
    };
  }

  return base;
}

export async function createQstashSchedule({
  triggerId,
  cron,
  scheduleId,
}: CreateQstashScheduleProps) {
  const client = getQStashClient();
  const appUrl = getAppUrl();

  const destination = `${appUrl}/api/workflows/schedule`;

  const result = await client.schedules.create({
    ...(scheduleId && { scheduleId }),
    destination,
    cron,
    body: JSON.stringify({ triggerId }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  const resolvedScheduleId = result.scheduleId ?? scheduleId;

  if (!resolvedScheduleId) {
    throw new Error("QStash schedule id was not returned");
  }

  return resolvedScheduleId;
}

export async function deleteQstashSchedule(scheduleId: string) {
  const client = getQStashClient();
  await client.schedules.delete(scheduleId);
}

export async function triggerScheduleNow(
  triggerId: string,
  options?: { delay?: WorkflowDelay; manual?: boolean }
) {
  const client = getWorkflowClient();
  const appUrl = getAppUrl();

  const destination = `${appUrl}/api/workflows/schedule`;

  const result = await client.trigger({
    url: destination,
    body: { triggerId, ...(options?.manual && { manual: true }) },
    ...(options?.delay && { delay: options.delay }),
  });

  return result.workflowRunId;
}

export async function triggerEventNow(
  payload: EventWorkflowPayload,
  options?: { delay?: WorkflowDelay }
) {
  const client = getWorkflowClient();
  const appUrl = getAppUrl();

  const destination = `${appUrl}/api/workflows/event`;

  const result = await client.trigger({
    url: destination,
    body: payload,
    ...(options?.delay && { delay: options.delay }),
  });

  return result.workflowRunId;
}
