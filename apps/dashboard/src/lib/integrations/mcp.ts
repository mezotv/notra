import {
  type AddMcpServerFormValues,
  MCP_URL_PROTOCOL_REGEX,
} from "@/schemas/integrations";

export const MCP_ACCENT_COLOR = "#9333EA";

export function buildMcpUrl(raw: string) {
  const host = raw.trim().replace(MCP_URL_PROTOCOL_REGEX, "");
  return host ? `https://${host}` : "";
}

export function getMcpFaviconUrl(url: string | null | undefined) {
  if (!url) {
    return undefined;
  }
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  try {
    const domain = new URL(normalizedUrl).hostname
      .split(".")
      .slice(-2)
      .join(".");
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return undefined;
  }
}

export function getMcpFaviconFromToolMetadata(
  toolMetadata: unknown,
  servers: ReadonlyArray<{ id: string; url: string }> | undefined
) {
  if (!(servers && toolMetadata) || typeof toolMetadata !== "object") {
    return undefined;
  }
  const notra = (toolMetadata as Record<string, unknown>).notra;
  if (!notra || typeof notra !== "object") {
    return undefined;
  }
  const serverId = (notra as Record<string, unknown>).serverId;
  if (typeof serverId !== "string") {
    return undefined;
  }
  const server = servers.find((candidate) => candidate.id === serverId);
  return server ? getMcpFaviconUrl(server.url) : undefined;
}

export function getMcpFormErrorMessage(error: unknown) {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Invalid value";
}

export function buildMcpHeaders(
  value: Pick<AddMcpServerFormValues, "headers">
) {
  const headers: Record<string, string> = {};

  for (const row of value.headers) {
    const name = row.name.trim();
    const headerValue = row.value.trim();
    if (name && headerValue) {
      headers[name] = headerValue;
    }
  }

  return headers;
}
