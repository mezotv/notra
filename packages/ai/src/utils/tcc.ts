import { OpenTelemetry } from "@ai-sdk/otel";
import type { TccMetadata, TccMetadataValue } from "@notra/ai/types/tcc";
import type { TelemetryOptions } from "ai";

export type { TccMetadata } from "@notra/ai/types/tcc";

export function buildTelemetryOptions(
  metadata?: TccMetadata
): TelemetryOptions {
  if (!metadata) {
    return {};
  }

  const entries = Object.entries(metadata).filter(
    ([, value]) => value !== null && value !== undefined
  ) as [string, TccMetadataValue][];

  if (entries.length === 0) {
    return {};
  }

  const attributes = Object.fromEntries(entries);

  return {
    integrations: [new OpenTelemetry({ enrichSpan: () => attributes })],
  };
}
