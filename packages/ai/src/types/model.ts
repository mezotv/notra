import type { withSupermemory } from "@supermemory/tools/ai-sdk";

type InferredSupermemoryOptions = NonNullable<
  Parameters<typeof withSupermemory>[2]
>;

export interface SupermemoryOptions extends InferredSupermemoryOptions {}
