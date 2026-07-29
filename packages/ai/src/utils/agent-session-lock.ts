import { redis } from "@notra/ai/utils/redis";

const SEND_LOCK_TTL_SECONDS = 120;

function sendLockKey(eveSessionId: string) {
  return `agent:send-lock:${eveSessionId}`;
}

export async function acquireAgentSendLock(
  eveSessionId: string
): Promise<boolean> {
  if (!redis) {
    return true;
  }
  const result = await redis.set(sendLockKey(eveSessionId), "1", {
    nx: true,
    ex: SEND_LOCK_TTL_SECONDS,
  });
  return result === "OK";
}

export async function releaseAgentSendLock(
  eveSessionId: string
): Promise<void> {
  if (!redis) {
    return;
  }
  await redis.del(sendLockKey(eveSessionId));
}
