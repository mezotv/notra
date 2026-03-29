import { gateway } from "@notra/ai/gateway";
import {
  type AILogTarget,
  wrapModelWithObservability,
} from "@notra/ai/observability";
import type { GatewayArgs, GatewayResult } from "@notra/ai/types/gateway";
import type { SupermemoryOptions } from "@notra/ai/types/model";
import { withSupermemory } from "@supermemory/tools/ai-sdk";

export function createModel(
  organizationId: string | undefined,
  modelId: GatewayArgs[0],
  options?: Omit<SupermemoryOptions, "mode" | "addMemory">,
  log?: AILogTarget
): GatewayResult {
  const base = gateway(modelId);

  if (!organizationId) {
    return wrapModelWithObservability(base, log);
  }

  const model = withSupermemory(base, organizationId, {
    mode: "full",
    addMemory: "always",
    ...options,
  });

  return wrapModelWithObservability(model, log);
}
