import { Client as QStashClient } from "@upstash/qstash";

import type {
  CreateQstashRouteScheduleProps,
  PublishQstashRouteProps,
} from "../types/qstash";
import {
  getConfiguredAppUrl,
  getConfiguredWorkflowUrl,
  requireConfiguredAppUrl,
} from "../utils/url";

export interface CreateQstashScheduleProps {
  triggerId: string;
  cron: string;
  scheduleId?: string;
}

export interface TriggerCronConfig {
  frequency: "daily" | "weekly" | "monthly";
  hour?: number;
  minute?: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}

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
  return getConfiguredWorkflowUrl() ?? getConfiguredAppUrl();
}

function getQStashClient() {
  return new QStashClient({ token: getQstashToken() });
}

export function buildCronExpression(config?: TriggerCronConfig) {
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

export function normalizeCronConfig(config?: TriggerCronConfig) {
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

export async function createQstashRouteSchedule({
  path,
  cron,
  body,
  scheduleId,
}: CreateQstashRouteScheduleProps) {
  const client = getQStashClient();
  const appUrl = getAppUrl();

  const result = await client.schedules.create({
    ...(scheduleId && { scheduleId }),
    destination: `${appUrl}${path}`,
    cron,
    body: JSON.stringify(body),
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

export async function publishQstashRoute({
  path,
  body,
  delaySeconds,
}: PublishQstashRouteProps) {
  const client = getQStashClient();
  const result = await client.publishJSON({
    url: `${getAppUrl()}${path}`,
    body,
    delay: delaySeconds,
  });
  return result.messageId;
}

export async function deleteQstashMessage(messageId: string) {
  const client = getQStashClient();
  await client.messages.delete(messageId);
}
