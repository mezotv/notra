import { Redis } from "@upstash/redis";

import { IP_CHECKER_LIST_REVALIDATE_SECONDS } from "@/constants/ip-checker";
import type { CrawlerIpList, CrawlerIpListPayload } from "@/types/ip-checker";

const MEMORY_TTL_MS = IP_CHECKER_LIST_REVALIDATE_SECONDS * 1000;
const REDIS_KEY_PREFIX = "ip-checker:list:";

let memory: { lists: CrawlerIpList[]; expiresAt: number } | null = null;
let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) {
    return redis;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!(url && token)) {
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

export function readListsFromMemory(): CrawlerIpList[] | null {
  if (memory && memory.expiresAt > Date.now()) {
    return memory.lists;
  }
  return null;
}

export function writeListsToMemory(lists: CrawlerIpList[]): void {
  memory = { lists, expiresAt: Date.now() + MEMORY_TTL_MS };
}

export async function readPayloadFromRedis(
  sourceId: string
): Promise<CrawlerIpListPayload | null> {
  const client = getRedis();
  if (!client) {
    return null;
  }
  try {
    return await client.get<CrawlerIpListPayload>(
      `${REDIS_KEY_PREFIX}${sourceId}`
    );
  } catch {
    return null;
  }
}

export async function writePayloadToRedis(
  sourceId: string,
  payload: CrawlerIpListPayload
): Promise<void> {
  const client = getRedis();
  if (!client) {
    return;
  }
  try {
    await client.set(`${REDIS_KEY_PREFIX}${sourceId}`, payload, {
      ex: IP_CHECKER_LIST_REVALIDATE_SECONDS,
    });
  } catch {
    return;
  }
}
