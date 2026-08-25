import type { ContextItem } from "@notra/ai/types/chat";
import {
  GITHUB_REFERENCE_VALUE_PATTERN,
  INTEGRATION_REFERENCE_TOKEN_SPLIT_REGEX,
  LINEAR_REFERENCE_VALUE_PATTERN,
  MCP_REFERENCE_VALUE_PATTERN,
} from "@/constants/integration-reference";

export function getIntegrationReferenceValue(item: ContextItem): string {
  if (item.type === "github-repo") {
    return `@integration/github/${item.integrationId}/${item.owner}/${item.repo}`;
  }
  if (item.type === "mcp-server") {
    return `@integration/mcp/${item.integrationId}/${encodeURIComponent(item.name)}`;
  }
  return `@integration/linear/${item.integrationId}`;
}

export function getReferenceDisplay(item: ContextItem): string {
  if (item.type === "github-repo") {
    return `@${item.owner}/${item.repo}`;
  }
  return item.type === "linear-team"
    ? `@${item.teamName ?? "Linear"}`
    : `@${item.name}`;
}

export function parseReferenceValue(value: string): ContextItem | null {
  const trimmed = value.trim();

  const githubMatch = trimmed.match(GITHUB_REFERENCE_VALUE_PATTERN);
  if (githubMatch) {
    const [, integrationId, owner, repo] = githubMatch;
    if (integrationId && owner && repo) {
      return { type: "github-repo", integrationId, owner, repo };
    }
  }

  const linearMatch = trimmed.match(LINEAR_REFERENCE_VALUE_PATTERN);
  if (linearMatch) {
    const [, integrationId] = linearMatch;
    if (integrationId) {
      return { type: "linear-team", integrationId };
    }
  }

  const mcpMatch = trimmed.match(MCP_REFERENCE_VALUE_PATTERN);
  if (mcpMatch) {
    const [, integrationId, encodedName] = mcpMatch;
    if (integrationId && encodedName) {
      try {
        return {
          type: "mcp-server",
          integrationId,
          name: decodeURIComponent(encodedName),
        };
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function extractIntegrationReferences(value: string) {
  const items: ContextItem[] = [];
  const textSegments: string[] = [];

  for (const segment of value.split(INTEGRATION_REFERENCE_TOKEN_SPLIT_REGEX)) {
    const item = parseReferenceValue(segment);
    if (item) {
      items.push(item);
    } else {
      textSegments.push(segment);
    }
  }

  return { items, text: textSegments.join("") };
}
