import { Redis } from "@upstash/redis";

interface RedisEnv {
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
}

let cachedRedis: Redis | null = null;
let cachedUrl: string | undefined;
let cachedToken: string | undefined;

export function getRedis(env: RedisEnv) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;

  if (!(url && token)) {
    return null;
  }

  if (cachedRedis && cachedUrl === url && cachedToken === token) {
    return cachedRedis;
  }

  cachedUrl = url;
  cachedToken = token;
  cachedRedis = new Redis({ url, token });
  return cachedRedis;
}
