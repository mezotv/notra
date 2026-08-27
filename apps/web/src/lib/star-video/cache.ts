import { Redis } from "@upstash/redis";
import { Effect } from "effect";

import type { RepoStarData } from "@/types/star-video";

const CACHE_TTL_SECONDS = 60 * 60 * 24;
const CACHE_PREFIX = "star-video:data:";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

function cacheKey(id: string): string {
  return `${CACHE_PREFIX}${id}`;
}

export const getCachedRepoStarData = Effect.fn("getCachedRepoStarData")(
  function* (id: string) {
    const client = getRedis();
    if (!client) {
      return null;
    }

    return yield* Effect.tryPromise(() =>
      client.get<RepoStarData>(cacheKey(id))
    ).pipe(Effect.orElseSucceed(() => null));
  }
);

export const setCachedRepoStarData = Effect.fn("setCachedRepoStarData")(
  function* (id: string, data: RepoStarData) {
    const client = getRedis();
    if (!client) {
      return;
    }

    yield* Effect.tryPromise(() =>
      client.set(cacheKey(id), data, { ex: CACHE_TTL_SECONDS })
    ).pipe(Effect.ignore);
  }
);
