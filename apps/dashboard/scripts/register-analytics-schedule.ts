import { getAppUrl } from "@notra/ai/qstash/triggers";
import { Client as QStashClient } from "@upstash/qstash";

const TWICE_DAILY_CRON = "0 6,18 * * *";
const SCHEDULE_ID = "social-analytics-sync";

const token = process.env.QSTASH_TOKEN;
if (!token) {
  throw new Error("QSTASH_TOKEN is not configured");
}

const client = new QStashClient({ token });
const destination = `${getAppUrl()}/api/workflows/social-analytics-sync`;

const result = await client.schedules.create({
  scheduleId: SCHEDULE_ID,
  destination,
  cron: TWICE_DAILY_CRON,
  body: JSON.stringify({}),
  headers: { "Content-Type": "application/json" },
});

console.log(
  `Registered schedule ${result.scheduleId ?? SCHEDULE_ID} -> ${destination} (${TWICE_DAILY_CRON})`
);
process.exit(0);
