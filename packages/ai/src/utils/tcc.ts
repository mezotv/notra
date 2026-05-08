import type { TccMetadata, TccMetadataValue } from "@notra/ai/types/tcc";

export type { TccMetadata } from "@notra/ai/types/tcc";

export function buildExperimentalTelemetry(metadata?: TccMetadata) {
  if (!metadata) {
    return { isEnabled: true } as const;
  }

  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== undefined
  ) as [string, TccMetadataValue][];

  if (entries.length === 0) {
    return { isEnabled: true } as const;
  }

  return {
    isEnabled: true,
    metadata: Object.fromEntries(entries),
  } as const;
}
