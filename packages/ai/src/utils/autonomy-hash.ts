import { createHash } from "node:crypto";

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : 1));
    const normalized: Record<string, unknown> = Object.create(null);
    for (const [key, entryValue] of entries) {
      normalized[key] = stableValue(entryValue);
    }
    return normalized;
  }
  return value;
};

export const stableJsonStringify = (value: unknown): string =>
  JSON.stringify(stableValue(value)) ?? "null";

export const computeStableInputHash = (value: unknown): string =>
  createHash("sha256").update(stableJsonStringify(value)).digest("hex");

export const computeNamespacedId = (
  namespace: string,
  parts: readonly string[],
  length: number
): string =>
  createHash("sha256")
    .update(JSON.stringify([namespace, ...parts]))
    .digest("hex")
    .slice(0, length);

export const computeSignalDedupeHash = (
  source: string,
  kind: string,
  discriminator: string
): string =>
  createHash("sha256")
    .update(JSON.stringify([source, kind, discriminator]))
    .digest("hex");
