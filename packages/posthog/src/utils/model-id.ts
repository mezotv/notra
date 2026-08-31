const GATEWAY_PREFIXES = new Set(["vercel", "openrouter"]);

export interface ParsedModelId {
  provider: string;
  model: string;
}

export function parseGatewayModelId(modelId: string): ParsedModelId {
  const segments = modelId.split("/").filter(Boolean);
  if (segments.length === 0) {
    return { provider: "unknown", model: modelId };
  }
  if (segments.length === 1) {
    return { provider: "unknown", model: segments[0] ?? modelId };
  }

  const first = segments[0] ?? "";
  if (GATEWAY_PREFIXES.has(first) && segments.length >= 3) {
    return {
      provider: segments[1] ?? "unknown",
      model: segments.slice(2).join("/"),
    };
  }

  return { provider: first, model: segments.slice(1).join("/") };
}
