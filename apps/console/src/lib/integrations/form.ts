import type {
  ApiKeyStyle,
  AuthChoice,
  HeaderRow,
  McpAuthType,
  McpIntegrationTool,
  McpServer,
  ToolPhraseDraft,
} from "@/types/integrations";

export function buildInitialPhraseDrafts(tools: McpIntegrationTool[]) {
  const drafts: Record<string, ToolPhraseDraft> = {};
  for (const tool of tools) {
    drafts[tool.serverToolName] = {
      serverToolName: tool.serverToolName,
      actionPhrasePresent: tool.actionPhrasePresent ?? "",
      actionPhrasePast: tool.actionPhrasePast ?? "",
    };
  }
  return drafts;
}

export function findDuplicateHeaderName(headerRows: HeaderRow[]) {
  const seen = new Set<string>();
  for (const row of headerRows) {
    const name = row.name.trim().toLowerCase();
    if (!name) {
      continue;
    }
    if (seen.has(name)) {
      return row.name.trim();
    }
    seen.add(name);
  }
  return null;
}

export function applyPhraseDraftChange(
  current: Record<string, ToolPhraseDraft>,
  serverToolName: string,
  field: "actionPhrasePresent" | "actionPhrasePast",
  value: string
): Record<string, ToolPhraseDraft> {
  return {
    ...current,
    [serverToolName]: {
      serverToolName,
      actionPhrasePresent:
        field === "actionPhrasePresent"
          ? value
          : (current[serverToolName]?.actionPhrasePresent ?? ""),
      actionPhrasePast:
        field === "actionPhrasePast"
          ? value
          : (current[serverToolName]?.actionPhrasePast ?? ""),
    },
  };
}

export function getChangedToolPhraseDrafts(
  drafts: Record<string, ToolPhraseDraft>,
  baseline: Record<string, ToolPhraseDraft>
) {
  return Object.values(drafts).filter((draft) => {
    const base = baseline[draft.serverToolName];
    return (
      (draft.actionPhrasePresent ?? "") !== (base?.actionPhrasePresent ?? "") ||
      (draft.actionPhrasePast ?? "") !== (base?.actionPhrasePast ?? "")
    );
  });
}

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

  const entries: [string, string][] = [];
  for (const row of params.headerRows) {
    const name = row.name.trim();
    const value = row.value.trim();
    if (name && value) {
      entries.push([name, value]);
    }
  }
  return Object.fromEntries(entries);
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
    server.headerNames[0]?.toLowerCase() === "authorization"
  );
}

export function getInitialApiKeyStyle(server?: McpServer): ApiKeyStyle {
  if (!server?.hasHeaders) {
    return "bearer";
  }

  return hasStoredBearerHeader(server) ? "bearer" : "headers";
}

export function getIntegrationInitials(name: string) {
  return name.trim().slice(0, 2).toUpperCase() || "?";
}
