import { toolPhraseImportFileSchema } from "@/schemas/integrations";
import type {
  McpIntegrationTool,
  ToolPhraseDraft,
  ToolPhraseImportEntry,
} from "@/types/integrations";

export function stripJsonComments(text: string) {
  let result = "";
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        result += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      result += char;
      if (char === "\\") {
        result += next ?? "";
        index += 1;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      result += char;
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    result += char;
  }

  return result;
}

export function parseToolPhrasesFile(text: string): ToolPhraseImportEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonComments(text));
  } catch {
    throw new Error("That file is not valid JSON or JSONC");
  }

  const validation = toolPhraseImportFileSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(
      validation.error.issues[0]?.message ??
        "Expected a list of { serverToolName, actionPhrasePresent, actionPhrasePast }"
    );
  }

  return validation.data;
}

export function buildToolPhrasesJsonc(
  tools: McpIntegrationTool[],
  drafts: Record<string, ToolPhraseDraft>
) {
  const entries = tools.map((tool) => {
    const draft = drafts[tool.serverToolName];
    return {
      serverToolName: tool.serverToolName,
      actionPhrasePresent: draft?.actionPhrasePresent?.trim() || null,
      actionPhrasePast: draft?.actionPhrasePast?.trim() || null,
    };
  });

  const header = [
    "// Notra tool action phrases",
    "// serverToolName: the tool's name as the MCP server exposes it",
    "// actionPhrasePresent: shown in chat while the tool runs",
    "// actionPhrasePast: shown in chat after the tool ran",
  ].join("\n");

  return `${header}\n${JSON.stringify(entries, null, 2)}\n`;
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const MANUAL_TOOL_ID_PREFIX = "manual:";

export function createManualTool(serverToolName: string): McpIntegrationTool {
  return {
    id: `${MANUAL_TOOL_ID_PREFIX}${serverToolName}`,
    serverToolName,
    title: null,
    description: null,
    actionPhrasePresent: null,
    actionPhrasePast: null,
    isManual: true,
  };
}

export function isManualTool(tool: McpIntegrationTool) {
  return tool.isManual === true || tool.id.startsWith(MANUAL_TOOL_ID_PREFIX);
}

export function mergeManualTools(
  indexedTools: McpIntegrationTool[],
  manualTools: McpIntegrationTool[]
) {
  const knownNames = new Set(indexedTools.map((tool) => tool.serverToolName));
  return [
    ...indexedTools,
    ...manualTools.filter((tool) => !knownNames.has(tool.serverToolName)),
  ];
}
