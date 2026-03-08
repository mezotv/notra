import { redis } from "@/lib/redis";
import type {
  ActiveGeneration,
  GenerationResult,
} from "@/types/generations/tracking";

const ACTIVE_KEY_PREFIX = "generations:active";
const RESULTS_KEY_PREFIX = "generations:results";
const ACTIVE_TTL_SECONDS = 600;
const RESULTS_TTL_SECONDS = 60;

function getActiveKey(organizationId: string): string {
  return `${ACTIVE_KEY_PREFIX}:${organizationId}`;
}

function getResultsKey(organizationId: string): string {
  return `${RESULTS_KEY_PREFIX}:${organizationId}`;
}

export function generateRunId(triggerId: string): string {
  return `${triggerId}-${Date.now()}`;
}

export async function addActiveGeneration(
  organizationId: string,
  generation: ActiveGeneration
): Promise<void> {
  if (!redis) {
    return;
  }

  const key = getActiveKey(organizationId);
  await redis.hset(key, {
    [generation.runId]: JSON.stringify(generation),
  });
  await redis.expire(key, ACTIVE_TTL_SECONDS);
}

export async function completeActiveGeneration(
  organizationId: string,
  result: GenerationResult
): Promise<void> {
  if (!redis) {
    return;
  }

  const activeKey = getActiveKey(organizationId);
  await redis.hdel(activeKey, result.runId);

  const resultsKey = getResultsKey(organizationId);
  await redis.hset(resultsKey, {
    [result.runId]: JSON.stringify(result),
  });
  await redis.expire(resultsKey, RESULTS_TTL_SECONDS);
}

export async function getActiveGenerations(
  organizationId: string
): Promise<ActiveGeneration[]> {
  if (!redis) {
    return [];
  }

  const key = getActiveKey(organizationId);
  const data = await redis.hgetall<Record<string, string>>(key);

  if (!data) {
    return [];
  }

  return Object.values(data).map((value) =>
    typeof value === "string" ? JSON.parse(value) : (value as ActiveGeneration)
  );
}

export async function getCompletedGenerations(
  organizationId: string
): Promise<GenerationResult[]> {
  if (!redis) {
    return [];
  }

  const key = getResultsKey(organizationId);
  const data = await redis.hgetall<Record<string, string>>(key);

  if (!data) {
    return [];
  }

  return Object.values(data).map((value) =>
    typeof value === "string" ? JSON.parse(value) : (value as GenerationResult)
  );
}

export async function clearCompletedGeneration(
  organizationId: string,
  runId: string
): Promise<void> {
  if (!redis) {
    return;
  }

  const key = getResultsKey(organizationId);
  await redis.hdel(key, runId);
}
