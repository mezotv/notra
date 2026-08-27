import { autumn } from "@notra/ai/billing/autumn";
import { FEATURES } from "@notra/ai/billing/features";
import { shouldApplyMarkup } from "@notra/ai/billing/token-pricing";

import type {
  AiCreditFinalizeInput,
  AiCreditReservation,
} from "@/types/billing/ai-credit-lock";

const LOCK_TTL_MS = 60 * 60 * 1000;
const DUPLICATE_STATUS_CODES = new Set([409]);
const GONE_STATUS_CODES = new Set([404, 409, 410]);

function buildLockId(executionId: string): string {
  return `ai-credit:${executionId}`;
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }
  if (
    error &&
    typeof error === "object" &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }
  return undefined;
}

export async function reserveAiCredits(
  organizationId: string,
  executionId: string,
  lockTtlMs: number = LOCK_TTL_MS
): Promise<AiCreditReservation> {
  if (!autumn) {
    return { allowed: true, reserved: false, useMarkup: false, lockId: null };
  }

  const lockId = buildLockId(executionId);
  try {
    const data = await autumn.check(
      {
        customerId: organizationId,
        featureId: FEATURES.AI_CREDITS,
        requiredBalance: 1,
        lock: { lockId, enabled: true, expiresAt: Date.now() + lockTtlMs },
      },
      { retries: { strategy: "none" }, headers: { "Idempotency-Key": lockId } }
    );

    if (!data.allowed) {
      return {
        allowed: false,
        reserved: false,
        useMarkup: false,
        lockId: null,
      };
    }
    return {
      allowed: true,
      reserved: true,
      useMarkup: shouldApplyMarkup(data.balance ?? null),
      lockId,
    };
  } catch (error) {
    if (DUPLICATE_STATUS_CODES.has(getErrorStatus(error) ?? 0)) {
      return { allowed: true, reserved: true, useMarkup: false, lockId };
    }
    throw new Error(`Autumn credit reservation failed: ${String(error)}`);
  }
}

export async function confirmAiCredits(
  input: AiCreditFinalizeInput
): Promise<void> {
  if (!(autumn && input.lockId)) {
    return;
  }
  try {
    await autumn.balances.finalize(
      {
        lockId: input.lockId,
        action: "confirm",
        overrideValue: input.costCents,
        properties: input.properties,
      },
      {
        headers: { "Idempotency-Key": `${input.lockId}:confirm` },
      }
    );
  } catch (error) {
    if (GONE_STATUS_CODES.has(getErrorStatus(error) ?? 0)) {
      return;
    }
    throw error;
  }
}

export async function releaseAiCredits(lockId: string | null): Promise<void> {
  if (!(autumn && lockId)) {
    return;
  }
  try {
    await autumn.balances.finalize(
      { lockId, action: "release" },
      { headers: { "Idempotency-Key": `${lockId}:release` } }
    );
  } catch (error) {
    if (GONE_STATUS_CODES.has(getErrorStatus(error) ?? 0)) {
      return;
    }
    throw error;
  }
}
