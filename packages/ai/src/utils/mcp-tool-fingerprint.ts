import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

export function createMcpToolFingerprint(value: unknown) {
  const input = JSON.stringify(sortJson(value)) ?? "undefined";
  return bytesToHex(sha256(utf8ToBytes(input)));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nested]) => [key, sortJson(nested)])
  );
}
