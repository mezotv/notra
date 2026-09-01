import {
  DEFAULT_CREDIT_CHECK_TTL_MS,
  DEFAULT_UNAVAILABLE_TTL_MS,
} from "@notra/ai/constants/router";
import type {
  CreditSnapshot,
  CreditTracker,
  FallbackReason,
  GatewayId,
  UnavailableMark,
} from "@notra/ai/types/router";

export function createCreditTracker(
  ttlMs: number = DEFAULT_CREDIT_CHECK_TTL_MS,
  now: () => number = () => Date.now(),
  unavailableTtlMs: number = DEFAULT_UNAVAILABLE_TTL_MS
): CreditTracker {
  const snapshots = new Map<GatewayId, CreditSnapshot>();
  const marks = new Map<string, UnavailableMark>();

  const markKey = (gateway: GatewayId, modelId?: string): string =>
    modelId ? `${gateway}:${modelId}` : gateway;

  const readMark = (key: string): FallbackReason | undefined => {
    const mark = marks.get(key);
    if (!mark) {
      return undefined;
    }
    if (mark.until > now()) {
      return mark.reason;
    }
    marks.delete(key);
    return undefined;
  };

  const isFresh = (snapshot: CreditSnapshot | undefined): boolean =>
    snapshot !== undefined && now() - snapshot.checkedAt < ttlMs;

  const isExhausted = (gateway: GatewayId): boolean => {
    const snapshot = snapshots.get(gateway);
    if (!isFresh(snapshot) || snapshot?.balance == null) {
      return false;
    }
    return snapshot.balance <= 0;
  };

  return {
    record(gateway, balance) {
      snapshots.set(gateway, { balance, checkedAt: now() });
    },
    markExhausted(gateway) {
      snapshots.set(gateway, { balance: 0, checkedAt: now() });
    },
    markUnavailable(gateway, reason, modelId) {
      marks.set(markKey(gateway, modelId), {
        reason,
        until: now() + unavailableTtlMs,
      });
    },
    isExhausted,
    unavailableReason(gateway, modelId) {
      if (isExhausted(gateway)) {
        return "no-credits";
      }
      const gatewayWide = readMark(markKey(gateway));
      if (gatewayWide) {
        return gatewayWide;
      }
      return modelId ? readMark(markKey(gateway, modelId)) : undefined;
    },
    isStale(gateway) {
      return !isFresh(snapshots.get(gateway));
    },
    snapshot(gateway) {
      return snapshots.get(gateway);
    },
  };
}
