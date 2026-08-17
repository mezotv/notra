import type { FallbackReason, GatewayId } from "./types";

interface CreditSnapshot {
  balance: number | null;
  checkedAt: number;
}

interface UnavailableMark {
  reason: FallbackReason;
  until: number;
}

/**
 * Tracks per-gateway availability signals that should influence routing for
 * a short time: observed credit balances and temporary marks such as "this
 * gateway rejected the ZDR requirement".
 */
export interface CreditTracker {
  /** Record a balance observation (null = unknown). */
  record(gateway: GatewayId, balance: number | null): void;
  /** Mark a gateway as exhausted (e.g. after an upstream 402). */
  markExhausted(gateway: GatewayId): void;
  /** Temporarily mark a gateway unavailable for the given reason. */
  markUnavailable(gateway: GatewayId, reason: FallbackReason): void;
  /** True while a recent observation says the gateway has no credits. */
  isExhausted(gateway: GatewayId): boolean;
  /** Reason the gateway should currently be skipped, if any. */
  unavailableReason(gateway: GatewayId): FallbackReason | undefined;
  /** True when no fresh balance observation exists and a lookup should run. */
  isStale(gateway: GatewayId): boolean;
  snapshot(gateway: GatewayId): CreditSnapshot | undefined;
}

export const DEFAULT_CREDIT_CHECK_TTL_MS = 30_000;
export const DEFAULT_UNAVAILABLE_TTL_MS = 5 * 60_000;

export function createCreditTracker(
  ttlMs: number = DEFAULT_CREDIT_CHECK_TTL_MS,
  now: () => number = () => Date.now(),
  unavailableTtlMs: number = DEFAULT_UNAVAILABLE_TTL_MS
): CreditTracker {
  const snapshots = new Map<GatewayId, CreditSnapshot>();
  const marks = new Map<GatewayId, UnavailableMark>();

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
    markUnavailable(gateway, reason) {
      marks.set(gateway, { reason, until: now() + unavailableTtlMs });
    },
    isExhausted,
    unavailableReason(gateway) {
      if (isExhausted(gateway)) {
        return "no-credits";
      }
      const mark = marks.get(gateway);
      if (mark && mark.until > now()) {
        return mark.reason;
      }
      if (mark) {
        marks.delete(gateway);
      }
      return undefined;
    },
    isStale(gateway) {
      return !isFresh(snapshots.get(gateway));
    },
    snapshot(gateway) {
      return snapshots.get(gateway);
    },
  };
}
