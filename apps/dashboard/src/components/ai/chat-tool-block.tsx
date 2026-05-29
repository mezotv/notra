"use client";

import { ArrowDown01Icon, CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shimmer } from "@notra/ui/components/ai-elements/shimmer";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { cn } from "@notra/ui/lib/utils";
import { useState } from "react";

function getString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entry = (value as Record<string, unknown>)[key];
  return typeof entry === "string" ? entry : undefined;
}

function getStringPath(
  value: unknown,
  path: readonly string[]
): string | undefined {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : undefined;
}

function getNumber(value: unknown, key: string): number | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entry = (value as Record<string, unknown>)[key];
  return typeof entry === "number" ? entry : undefined;
}

function getArray(value: unknown, key: string): unknown[] | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entry = (value as Record<string, unknown>)[key];
  return Array.isArray(entry) ? entry : undefined;
}

function getRecord(
  value: unknown,
  key: string
): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entry = (value as Record<string, unknown>)[key];
  return entry && typeof entry === "object" && !Array.isArray(entry)
    ? (entry as Record<string, unknown>)
    : undefined;
}

interface ToolCopy {
  verbs: readonly [present: string, past: string];
  noun: string;
  subtitle?: (params: {
    input: unknown;
    output: unknown;
    isStreaming: boolean;
  }) => string | undefined;
  suffix?: (input: unknown, output: unknown) => string | undefined;
}

function idSuffix(input: unknown, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const value = getString(input, key);
    if (value) {
      return value.slice(0, 8);
    }
  }
  return undefined;
}

function shortPreview(value: string, maxLength = 72): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function quotedSuffix(
  input: unknown,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = getString(input, key);
    if (value) {
      return `"${shortPreview(value)}"`;
    }
  }
  return undefined;
}

function memoryIdSuffix(input: unknown, output: unknown): string | undefined {
  return (
    idSuffix(input, ["memoryId", "documentId", "id"]) ??
    idSuffix(output, ["memoryId", "documentId", "id"]) ??
    getStringPath(output, ["memory", "id"])?.slice(0, 8) ??
    getStringPath(output, ["document", "id"])?.slice(0, 8)
  );
}

function memoryPathSuffix(input: unknown): string | undefined {
  const path = getString(input, "path");
  const newPath = getString(input, "new_path");
  if (path && newPath) {
    return `${path} → ${newPath}`;
  }
  return path;
}

function claudeMemorySubtitle({
  input,
  isStreaming,
}: {
  input: unknown;
  isStreaming: boolean;
}): string | undefined {
  const command = getString(input, "command");
  const suffix =
    memoryPathSuffix(input) ??
    quotedSuffix(input, ["file_text", "insert_text", "new_str"]);

  const withSuffix = (label: string) => (suffix ? `${label} ${suffix}` : label);

  switch (command) {
    case "view":
      return withSuffix(isStreaming ? "Viewing memory" : "Viewed memory");
    case "create":
      return withSuffix(isStreaming ? "Saving memory" : "Saved memory");
    case "delete":
      return withSuffix(isStreaming ? "Deleting memory" : "Deleted memory");
    case "rename":
      return withSuffix(isStreaming ? "Renaming memory" : "Renamed memory");
    case "insert":
    case "str_replace":
      return withSuffix(isStreaming ? "Updating memory" : "Updated memory");
    default:
      return withSuffix(isStreaming ? "Using memory" : "Used memory");
  }
}

function webSearchSuffix(input: unknown, output: unknown): string | undefined {
  const query = quotedSuffix(input, ["query"]);
  const count = getWebSearchResultCount(output);
  if (query && count !== undefined) {
    return `for ${query} (${count} ${count === 1 ? "result" : "results"})`;
  }
  return query ? `for ${query}` : undefined;
}

function getWebSearchResultCount(output: unknown): number | undefined {
  const directResults = getArray(output, "results") ?? getArray(output, "data");
  if (directResults) {
    return directResults.length;
  }

  if (!output || typeof output !== "object") {
    return undefined;
  }

  const data = (output as Record<string, unknown>).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined;
  }

  const resultGroups = ["web", "news", "images"].map((key) =>
    getArray(data, key)
  );
  const counts = resultGroups
    .filter((group): group is unknown[] => Boolean(group))
    .map((group) => group.length);

  return counts.length
    ? counts.reduce((total, count) => total + count, 0)
    : undefined;
}

const TOOL_COPY: Record<string, ToolCopy> = {
  getPullRequests: {
    verbs: ["Fetching", "Fetched"],
    noun: "pull request",
    suffix: (input, output) => {
      const repo = getString(output, "repository") ?? getString(output, "repo");
      const number =
        getNumber(output, "number") ?? getNumber(output, "pull_number");
      if (repo && number !== undefined) {
        return `${repo}#${number}`;
      }
      const pullNumber = getNumber(input, "pull_number");
      return pullNumber !== undefined ? `#${pullNumber}` : undefined;
    },
  },
  getReleaseByTag: {
    verbs: ["Fetching", "Fetched"],
    noun: "release",
    suffix: (input, output) => {
      const repo = getString(output, "repository") ?? getString(output, "repo");
      const tag = getString(output, "tag_name") ?? getString(output, "tag");
      if (repo && tag) {
        return `${repo} · ${tag}`;
      }
      return getString(input, "tag");
    },
  },
  getCommitsByTimeframe: {
    verbs: ["Fetching", "Fetched"],
    noun: "commits",
    suffix: (input) => {
      const days = getNumber(input, "days");
      return days ? `from the last ${days} days` : undefined;
    },
  },
  getLinearIssues: { verbs: ["Fetching", "Fetched"], noun: "issues" },
  getLinearProjects: { verbs: ["Fetching", "Fetched"], noun: "projects" },
  getLinearCycles: { verbs: ["Fetching", "Fetched"], noun: "cycles" },
  viewPost: {
    verbs: ["Viewing", "Viewed"],
    noun: "post",
    suffix: (input) => idSuffix(input, ["id", "postId"]),
  },
  updatePost: {
    verbs: ["Updating", "Updated"],
    noun: "post",
    suffix: (input) => quotedSuffix(input, ["title"]),
  },
  getAvailablePosts: { verbs: ["Loading", "Loaded"], noun: "posts" },
  getPostById: {
    verbs: ["Loading", "Loaded"],
    noun: "post",
    suffix: (input) => idSuffix(input, ["id", "postId"]),
  },
  listBrandIdentities: {
    verbs: ["Listing", "Listed"],
    noun: "brand identities",
  },
  getBrandIdentity: {
    verbs: ["Loading", "Loaded"],
    noun: "brand identity",
    suffix: (input) => quotedSuffix(input, ["name", "id"]),
  },
  getAvailableBrandReferences: {
    verbs: ["Loading", "Loaded"],
    noun: "brand references",
  },
  getAvailableIntegrations: {
    verbs: ["Checking", "Checked"],
    noun: "integrations",
  },
  listAvailableSkills: { verbs: ["Listing", "Listed"], noun: "skills" },
  getSkillByName: {
    verbs: ["Loading", "Loaded"],
    noun: "skill",
    suffix: (input) => quotedSuffix(input, ["name"]),
  },
  webSearch: {
    verbs: ["Searching", "Searched"],
    noun: "web",
    suffix: webSearchSuffix,
  },
  search: {
    verbs: ["Searching", "Searched"],
    noun: "web",
    suffix: webSearchSuffix,
  },
  searchMemories: {
    verbs: ["Searching", "Searched"],
    noun: "memory",
    suffix: (input) => quotedSuffix(input, ["informationToGet", "query", "q"]),
  },
  recall: {
    verbs: ["Searching", "Searched"],
    noun: "memory",
    suffix: (input) => quotedSuffix(input, ["informationToGet", "query", "q"]),
  },
  addMemory: {
    verbs: ["Saving", "Saved"],
    noun: "memory",
    suffix: (input, output) =>
      quotedSuffix(input, ["memory", "content", "text"]) ??
      memoryIdSuffix(input, output),
  },
  fetchMemory: {
    verbs: ["Fetching", "Fetched"],
    noun: "memory",
    suffix: memoryIdSuffix,
  },
  getProfile: {
    verbs: ["Checking", "Checked"],
    noun: "memory profile",
    suffix: (input) => quotedSuffix(input, ["query", "containerTag"]),
  },
  whoAmI: {
    verbs: ["Checking", "Checked"],
    noun: "memory account",
  },
  documentList: {
    verbs: ["Listing", "Listed"],
    noun: "memory documents",
    suffix: (input) => quotedSuffix(input, ["containerTag", "status"]),
  },
  documentAdd: {
    verbs: ["Saving", "Saved"],
    noun: "memory document",
    suffix: (input, output) =>
      quotedSuffix(input, ["title", "description", "content"]) ??
      memoryIdSuffix(input, output),
  },
  documentDelete: {
    verbs: ["Deleting", "Deleted"],
    noun: "memory document",
    suffix: (input) => idSuffix(input, ["documentId"]),
  },
  memoryForget: {
    verbs: ["Forgetting", "Forgot"],
    noun: "memory",
    suffix: (input) =>
      idSuffix(input, ["memoryId"]) ??
      quotedSuffix(input, ["memoryContent", "reason"]),
  },
  memory: {
    verbs: ["Using", "Used"],
    noun: "memory",
    subtitle: claudeMemorySubtitle,
  },
};

const MCP_TOOL_NAME_REGEX = /^mcp_/;
const UNDERSCORE_REGEX = /_+/g;

function formatMcpToolName(toolName: string): string {
  const label = toolName
    .replace(MCP_TOOL_NAME_REGEX, "")
    .replace(UNDERSCORE_REGEX, " ")
    .trim();
  return label || "MCP tool";
}

function getMcpToolLabel(toolName: string, toolMetadata: unknown) {
  const notraMetadata = getRecord(toolMetadata, "notra");
  const label = getString(notraMetadata, "label");
  if (label) {
    return label;
  }

  const serverName = getString(notraMetadata, "serverName");
  const mcpToolName = getString(notraMetadata, "toolName");
  if (serverName && mcpToolName) {
    return `${serverName} - ${mcpToolName}`;
  }

  return formatMcpToolName(toolName);
}

function getSubtitle({
  toolName,
  input,
  output,
  isStreaming,
  toolMetadata,
}: {
  toolName: string;
  input: unknown;
  output: unknown;
  isStreaming: boolean;
  toolMetadata?: unknown;
}): string {
  const copy = TOOL_COPY[toolName];
  if (!copy) {
    if (MCP_TOOL_NAME_REGEX.test(toolName)) {
      const label = getMcpToolLabel(toolName, toolMetadata);
      return isStreaming ? `Calling ${label}` : `Called ${label}`;
    }
    return isStreaming ? `Running ${toolName}` : `Ran ${toolName}`;
  }
  const subtitle = copy.subtitle?.({ input, output, isStreaming });
  if (subtitle) {
    return subtitle;
  }
  const verb = copy.verbs[isStreaming ? 0 : 1];
  const suffix = copy.suffix?.(input, isStreaming ? undefined : output);
  return suffix ? `${verb} ${copy.noun} ${suffix}` : `${verb} ${copy.noun}`;
}

const JSON_TOKEN_RE =
  /"(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
const MAX_JSON_RENDER_CHARS = 20_000;

function stringifyForDisplay(value: unknown): string | undefined {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return undefined;
  }
}

function JsonView({ value }: { value: unknown }) {
  const raw = stringifyForDisplay(value);
  if (raw === undefined) {
    return (
      <pre className="overflow-x-auto font-mono text-[0.75rem] text-muted-foreground">
        Unable to display value
      </pre>
    );
  }
  const truncated = raw.length > MAX_JSON_RENDER_CHARS;
  const text = truncated
    ? `${raw.slice(0, MAX_JSON_RENDER_CHARS)}\n… (${raw.length - MAX_JSON_RENDER_CHARS} more characters truncated)`
    : raw;

  const parts: Array<{ text: string; className: string; key: string }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(JSON_TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, start),
        className: "text-muted-foreground/70",
        key: `plain-${lastIndex}-${start}`,
      });
    }
    const token = match[0];
    let className = "text-foreground";
    if (token.startsWith('"')) {
      className = token.endsWith(":")
        ? "text-muted-foreground"
        : "text-foreground";
    } else if (token === "true" || token === "false") {
      className = "text-foreground";
    } else if (token === "null") {
      className = "text-muted-foreground/60 italic";
    } else {
      className = "text-foreground tabular-nums";
    }
    parts.push({
      text: token,
      className,
      key: `token-${start}-${token.length}`,
    });
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      className: "text-muted-foreground/70",
      key: `plain-${lastIndex}-${text.length}`,
    });
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border/50 bg-muted/30 p-3 font-mono text-[0.75rem] leading-relaxed">
      {parts.map((part) => (
        <span className={part.className} key={part.key}>
          {part.text}
        </span>
      ))}
    </pre>
  );
}

function ToolDataSection({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <div className="mb-2 font-medium text-[0.65rem] text-muted-foreground/70 uppercase tracking-wider">
        {label}
      </div>
      <JsonView value={value} />
    </div>
  );
}

interface ChatToolBlockProps {
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  isMcp?: boolean;
  mcpIconUrl?: string;
  toolMetadata?: unknown;
}

export function ChatToolBlock({
  toolName,
  state,
  input,
  output,
  isMcp = false,
  mcpIconUrl,
  toolMetadata,
}: ChatToolBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isStreaming =
    state === "input-streaming" || state === "input-available";
  const subtitle = getSubtitle({
    toolName,
    input,
    output,
    isStreaming,
    toolMetadata,
  });
  const hasInput = input != null;
  const hasOutput = output != null;
  const hasDetails = hasInput || hasOutput;

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger
        className="group flex w-full min-w-0 items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
        disabled={!hasDetails}
      >
        {isMcp && mcpIconUrl ? (
          <Avatar className="size-4 shrink-0 rounded-sm after:hidden">
            <AvatarImage className="rounded-sm" src={mcpIconUrl} />
            <AvatarFallback className="rounded-sm bg-transparent">
              <HugeiconsIcon className="size-3" icon={CpuIcon} />
            </AvatarFallback>
          </Avatar>
        ) : isMcp ? (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium text-[0.625rem] text-muted-foreground uppercase tracking-wide">
            MCP
          </span>
        ) : null}
        {isStreaming ? (
          <Shimmer
            as="span"
            className="min-w-0 truncate text-sm leading-5"
            duration={1.8}
          >
            {subtitle}
          </Shimmer>
        ) : (
          <span className="inline-block min-w-0 truncate leading-5">
            {subtitle}
          </span>
        )}
        <HugeiconsIcon
          aria-hidden
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground/60 transition-all",
            !hasDetails && "invisible",
            hasDetails && isOpen && "rotate-180 opacity-100",
            hasDetails &&
              !isOpen &&
              "rotate-0 opacity-0 group-hover:opacity-100"
          )}
          icon={ArrowDown01Icon}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden outline-none transition-[height,opacity] duration-300 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0">
        <div className="mt-3 space-y-4">
          {hasInput ? <ToolDataSection label="Input" value={input} /> : null}
          {hasOutput ? <ToolDataSection label="Output" value={output} /> : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
