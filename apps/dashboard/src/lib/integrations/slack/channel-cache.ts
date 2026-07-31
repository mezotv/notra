import { redis } from "@notra/ai/utils/redis";
import { SLACK_CHANNEL_CACHE_TTL_SECONDS } from "@/constants/slack-integration";
import type { SlackChannelOption } from "@/types/slack-integration";

function channelCacheKey(integrationId: string) {
  return `slack:channels:${integrationId}`;
}

export async function getCachedSlackChannels(
  integrationId: string
): Promise<SlackChannelOption[] | null> {
  if (!redis) {
    return null;
  }
  const cached = await redis.get<SlackChannelOption[]>(
    channelCacheKey(integrationId)
  );
  return Array.isArray(cached) ? cached : null;
}

export async function setCachedSlackChannels(
  integrationId: string,
  channels: SlackChannelOption[]
): Promise<void> {
  if (!redis) {
    return;
  }
  await redis.set(channelCacheKey(integrationId), JSON.stringify(channels), {
    ex: SLACK_CHANNEL_CACHE_TTL_SECONDS,
  });
}

export async function clearCachedSlackChannels(
  integrationId: string
): Promise<void> {
  if (!redis) {
    return;
  }
  await redis.del(channelCacheKey(integrationId));
}
