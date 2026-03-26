interface QstashEnv {
  QSTASH_TOKEN?: string;
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
