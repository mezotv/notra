import {
  captureServerException,
  flushPostHogServer,
} from "@notra/posthog/server";
import { getStepMetadata } from "workflow";

import type { StepErrorContext } from "@/types/analytics/workflow-events";

const DEFAULT_MAX_ATTEMPTS = 4;

export function isFinalStepAttempt(
  maxAttempts = DEFAULT_MAX_ATTEMPTS
): boolean {
  return getStepMetadata().attempt >= maxAttempts;
}

function readStepAttempt(): number | undefined {
  try {
    return getStepMetadata().attempt;
  } catch {
    return undefined;
  }
}

export async function reportStepError(
  error: unknown,
  context: StepErrorContext
): Promise<void> {
  captureServerException({
    error,
    organizationId: context.organizationId,
    properties: {
      workflow: context.workflow,
      step: context.step,
      attempt: readStepAttempt(),
      surface: "workflow",
    },
  });
  await flushPostHogServer();
}
