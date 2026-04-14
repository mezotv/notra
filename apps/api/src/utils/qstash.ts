interface QstashEnv {
  QSTASH_TOKEN?: string;
  WORKFLOW_BASE_URL?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function getScheduleDestinationUrl(env: QstashEnv) {
  if (!env.WORKFLOW_BASE_URL) {
    throw new Error("WORKFLOW_BASE_URL is not configured");
  }

  return `${trimTrailingSlash(env.WORKFLOW_BASE_URL)}/api/workflows/schedule`;
}

export function buildCronExpression(config: {
  frequency: "daily" | "weekly" | "monthly";
  hour: number;
  minute: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
}) {
  if (config.frequency === "weekly") {
    return `${config.minute} ${config.hour} * * ${config.dayOfWeek ?? 1}`;
  }

  if (config.frequency === "monthly") {
    return `${config.minute} ${config.hour} ${config.dayOfMonth ?? 1} * *`;
  }

  return `${config.minute} ${config.hour} * * *`;
}

export async function createQstashSchedule(
  env: QstashEnv,
  {
    triggerId,
    cron,
    scheduleId,
  }: {
    triggerId: string;
    cron: string;
    scheduleId?: string;
  }
) {
  const token = env.QSTASH_TOKEN;

  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }

  const destination = getScheduleDestinationUrl(env);
  const response = await fetch(
    `https://qstash.upstash.io/v2/schedules/${encodeURIComponent(destination)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Upstash-Cron": cron,
        ...(scheduleId ? { "Upstash-Schedule-Id": scheduleId } : {}),
      },
      body: JSON.stringify({ triggerId }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Failed to create QStash schedule: ${response.status} ${body}`.trim()
    );
  }

  const payload = (await response.json().catch(() => null)) as {
    scheduleId?: string;
  } | null;
  const resolvedScheduleId = payload?.scheduleId ?? scheduleId;

  if (!resolvedScheduleId) {
    throw new Error("QStash schedule id was not returned");
  }

  return resolvedScheduleId;
}

export async function deleteQstashSchedule(env: QstashEnv, scheduleId: string) {
  const token = env.QSTASH_TOKEN;

  if (!token) {
    throw new Error("QSTASH_TOKEN is not configured");
  }

  const response = await fetch(
    `https://qstash.upstash.io/v2/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok && response.status !== 404) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Failed to delete QStash schedule ${scheduleId}: ${response.status} ${body}`.trim()
    );
  }
}
