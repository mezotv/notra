import { decryptToken, encryptToken } from "../crypto/token-encryption";
import type { McpHeaderMap } from "../types/integrations";

export function encryptMcpHeaders(headers: McpHeaderMap = {}) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key, encryptToken(value)])
  );
}

export function decryptMcpHeaders(
  encryptedHeaders: McpHeaderMap | null
): McpHeaderMap {
  return Object.fromEntries(
    Object.entries(encryptedHeaders ?? {}).map(([key, value]) => [
      key,
      decryptToken(value),
    ])
  );
}
