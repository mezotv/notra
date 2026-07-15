import type {
  ApiKeyStyle,
  AuthChoice,
  HeaderRow,
  McpAuthType,
  McpServer,
} from "@/types/integrations";

export function buildHeadersFromForm(params: {
  authChoice: AuthChoice;
  apiKeyStyle: ApiKeyStyle;
  bearerToken: string;
  headerRows: HeaderRow[];
}) {
  if (params.authChoice !== "apikey") {
    return {};
  }

  if (params.apiKeyStyle === "bearer") {
    const token = params.bearerToken.trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  const headers: Record<string, string> = {};
  for (const row of params.headerRows) {
    const name = row.name.trim();
    const value = row.value.trim();
    if (name && value) {
      headers[name] = value;
    }
  }
  return headers;
}

export function authChoiceToAuthType(authChoice: AuthChoice): McpAuthType {
  if (authChoice === "apikey") {
    return "headers";
  }
  return authChoice;
}

export function authTypeToAuthChoice(authType: McpAuthType): AuthChoice {
  if (authType === "headers") {
    return "apikey";
  }
  return authType;
}

export function hasStoredBearerHeader(server?: McpServer) {
  return (
    Boolean(server?.hasHeaders) &&
    server?.headerNames.length === 1 &&
    server.headerNames[0] === "Authorization"
  );
}

export function getInitialApiKeyStyle(server?: McpServer): ApiKeyStyle {
  if (!server?.hasHeaders) {
    return "bearer";
  }

  return hasStoredBearerHeader(server) ? "bearer" : "headers";
}

const HEX_CHANNEL_MAX = 255;

export function rgbaToHex(channels: readonly number[]) {
  const toHex = (channel: number | undefined) =>
    Math.round(Math.min(Math.max(channel ?? 0, 0), HEX_CHANNEL_MAX))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(channels[0])}${toHex(channels[1])}${toHex(channels[2])}`;
}

export function getIntegrationInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}
