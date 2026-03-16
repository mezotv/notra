import { Redis } from "@upstash/redis";

interface RedisEnv {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

export function getRedis(env: RedisEnv) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!(url && token)) {
    return null;
  }

  return new Redis({ url, token });
}
