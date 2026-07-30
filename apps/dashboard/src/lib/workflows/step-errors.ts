import { getStepMetadata } from "workflow";

const DEFAULT_MAX_ATTEMPTS = 4;

export function isFinalStepAttempt(
  maxAttempts = DEFAULT_MAX_ATTEMPTS
): boolean {
  return getStepMetadata().attempt >= maxAttempts;
}
