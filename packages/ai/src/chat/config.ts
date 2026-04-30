import { Redis } from "@upstash/redis";
import type { ChatConfig } from "../types/chat";

let redisClient: Redis | null | undefined;

export function configureChat(config: Partial<ChatConfig>) {
  if (config.redis !== undefined) {
    redisClient = config.redis;
  }
}

export function getChatRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!(url && token)) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}
