import { gateway } from "@notra/ai/gateway";
import type { GatewayArgs, GatewayResult } from "@notra/ai/types/gateway";
import type { SupermemoryOptions } from "@notra/ai/types/model";
import { withSupermemory } from "@supermemory/tools/ai-sdk";

export function createModel(
  organizationId: string | undefined,
  modelId: GatewayArgs[0],
  options?: Omit<SupermemoryOptions, "mode" | "addMemory">
): GatewayResult {
  const base = gateway(modelId);

  if (!organizationId) {
    return base;
  }

  return withSupermemory(base, organizationId, {
    mode: "full",
    addMemory: "always",
    ...options,
  });
}
