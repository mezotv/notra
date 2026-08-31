import type { TccMetadata } from "@notra/ai/types/tcc";

export function readTelemetryString(
  metadata: TccMetadata | undefined,
  key: string
): string | undefined {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function buildTelemetrySessionId(
  prefix: string,
  metadata: TccMetadata | undefined,
  key: string
): string | undefined {
  const value = readTelemetryString(metadata, key);
  return value ? `${prefix}:${value}` : undefined;
}
