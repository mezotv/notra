"use client";

import { ArrowDown01Icon, CpuIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shimmer } from "@notra/ui/components/ai-elements/shimmer";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@notra/ui/components/ui/avatar";
import { Button } from "@notra/ui/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@notra/ui/components/ui/collapsible";
import { cn } from "@notra/ui/lib/utils";
import { CheckIcon, XIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import {
  commitsByTimeframeInputSchema,
  type MemoryToolInput,
  mcpToolMetadataSchema,
  memoryIdentifierInputSchema,
  memoryIdentifierOutputSchema,
  memoryToolInputSchema,
  pullRequestInputSchema,
  pullRequestOutputSchema,
  releaseInputSchema,
  releaseOutputSchema,
  type StringToolField,
  stringToolFieldsSchema,
  webSearchInputSchema,
  webSearchOutputSchema,
} from "@/schemas/ai/chat-tool-block";

interface ToolCopy {
  verbs: readonly [present: string, past: string];
  noun: string;
  subtitle?: (params: {
    input: unknown;
    output: unknown;
    isStreaming: boolean;
    isError: boolean;
  }) => string | undefined;
  suffix?: (input: unknown, output: unknown) => string | undefined;
}

function firstStringValue<T extends object>(
  values: T,
  keys: readonly (keyof T)[]
): string | undefined {
  for (const key of keys) {
    const value = values[key];
    if (typeof value === "string" && value) {
      return value;
    }
  }
  return undefined;
}

function idSuffixFromFields<T extends object>(
  values: T,
  keys: readonly (keyof T)[]
): string | undefined {
  const value = firstStringValue(values, keys);
  return value ? value.slice(0, 8) : undefined;
}

function idSuffix(
  input: unknown,
  keys: readonly StringToolField[]
): string | undefined {
  const parsed = stringToolFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return undefined;
  }
  return idSuffixFromFields(parsed.data, keys);
}

function shortPreview(value: string, maxLength = 72): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function quotedSuffixFromFields<T extends object>(
  values: T,
  keys: readonly (keyof T)[]
): string | undefined {
  for (const key of keys) {
    const value = values[key];
    if (typeof value === "string" && value) {
      return `"${shortPreview(value)}"`;
    }
  }
  return undefined;
}

function quotedSuffix(
  input: unknown,
  keys: readonly StringToolField[]
): string | undefined {
  const parsed = stringToolFieldsSchema.safeParse(input);
  if (!parsed.success) {
    return undefined;
  }
  return quotedSuffixFromFields(parsed.data, keys);
}

function memoryIdSuffix(input: unknown, output: unknown): string | undefined {
  const parsedInput = memoryIdentifierInputSchema.safeParse(input);
  const parsedOutput = memoryIdentifierOutputSchema.safeParse(output);
  const outputData = parsedOutput.success ? parsedOutput.data : undefined;
  return (
    (parsedInput.success
      ? idSuffixFromFields(parsedInput.data, ["memoryId", "documentId", "id"])
      : undefined) ??
    (outputData
      ? idSuffixFromFields(outputData, ["memoryId", "documentId", "id"])
      : undefined) ??
    outputData?.memory?.id?.slice(0, 8) ??
    outputData?.document?.id?.slice(0, 8)
  );
}

function memoryPathSuffix(input: MemoryToolInput): string | undefined {
  if (input.path && input.new_path) {
    return `${input.path} → ${input.new_path}`;
  }
  return input.path;
}

function memoryToolSubtitle({
  input,
  isStreaming,
}: {
  input: unknown;
  isStreaming: boolean;
}): string | undefined {
  const parsed = memoryToolInputSchema.safeParse(input);
  const command = parsed.success ? parsed.data.command : undefined;
  const suffix = parsed.success
    ? (memoryPathSuffix(parsed.data) ??
      quotedSuffixFromFields(parsed.data, [
        "file_text",
        "insert_text",
        "new_str",
      ]))
    : undefined;

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
  const parsedInput = webSearchInputSchema.safeParse(input);
  const query = parsedInput.success
    ? quotedSuffixFromFields(parsedInput.data, ["query"])
    : undefined;
  const count = getWebSearchResultCount(output);
  if (query && count !== undefined) {
    return `for ${query} (${count} ${count === 1 ? "result" : "results"})`;
  }
  return query ? `for ${query}` : undefined;
}

function getWebSearchResultCount(output: unknown): number | undefined {
  const parsed = webSearchOutputSchema.safeParse(output);
  if (!parsed.success) {
    return undefined;
  }

  if (parsed.data.results) {
    return parsed.data.results.length;
  }

  if (Array.isArray(parsed.data.data)) {
    return parsed.data.data.length;
  }

  const data = parsed.data.data;
  const counts = data
    ? [data.web, data.news, data.images]
        .filter((group): group is unknown[] => Boolean(group))
        .map((group) => group.length)
    : [];

  return counts.length
    ? counts.reduce((total, count) => total + count, 0)
    : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function getArrayLength(value: unknown, key: string): number | undefined {
  const array = asRecord(value)?.[key];
  return Array.isArray(array) ? array.length : undefined;
}

function getNumericValue(value: unknown, key: string): number | undefined {
  const number = asRecord(value)?.[key];
  return typeof number === "number" ? number : undefined;
}

function getStringArray(value: unknown, key: string): string[] {
  const array = asRecord(value)?.[key];
  return Array.isArray(array)
    ? array.filter((item): item is string => typeof item === "string")
    : [];
}

function getToolObjectNames(value: unknown, key: string): string[] {
  const array = asRecord(value)?.[key];
  if (!Array.isArray(array)) {
    return [];
  }

  return array
    .map((item) => {
      const record = asRecord(item);
      const name =
        record?.toolName ??
        record?.runtimeToolName ??
        record?.title ??
        record?.serverName;
      return typeof name === "string" ? name : undefined;
    })
    .filter((name): name is string => Boolean(name));
}

function countSuffix(
  count: number | undefined,
  singular: string,
  plural: string
) {
  if (count === undefined) {
    return undefined;
  }
  return `(${count} ${count === 1 ? singular : plural})`;
}

function toolSearchSuffix(input: unknown, output: unknown): string | undefined {
  const query = quotedSuffix(input, ["query"]);
  const count = getArrayLength(output, "results");
  const resultCount = countSuffix(count, "result", "results");
  if (query && resultCount) {
    return `for ${query} ${resultCount}`;
  }
  return query ?? resultCount;
}

function activatedToolsSuffix(output: unknown): string | undefined {
  const names = getToolObjectNames(output, "activated");
  if (names.length === 0) {
    return countSuffix(getArrayLength(output, "activated"), "tool", "tools");
  }
  if (names.length === 1) {
    return names[0];
  }
  return `(${names.length} tools)`;
}

function activeToolsSuffix(output: unknown): string | undefined {
  const names = [
    ...getStringArray(output, "activeTools"),
    ...getToolObjectNames(output, "activeTools"),
  ];
  if (names.length === 0) {
    return countSuffix(getArrayLength(output, "activeTools"), "tool", "tools");
  }
  return `(${names.length} active)`;
}

function deactivatedToolsSuffix(output: unknown): string | undefined {
  return countSuffix(
    getArrayLength(output, "deactivated") ??
      getNumericValue(output, "deactivated") ??
      getArrayLength(output, "removed") ??
      getNumericValue(output, "removed"),
    "tool",
    "tools"
  );
}

const TOOL_COPY: Record<string, ToolCopy> = {
  searchNotraTools: {
    verbs: ["Searching", "Searched"],
    noun: "tools",
    suffix: toolSearchSuffix,
  },
  activateNotraTools: {
    verbs: ["Loading", "Loaded"],
    noun: "tool",
    suffix: (_input, output) => activatedToolsSuffix(output),
  },
  listActiveNotraTools: {
    verbs: ["Checking", "Checked"],
    noun: "active tools",
    suffix: (_input, output) => activeToolsSuffix(output),
  },
  deactivateNotraTools: {
    verbs: ["Unloading", "Unloaded"],
    noun: "tools",
    suffix: (_input, output) => deactivatedToolsSuffix(output),
  },
  searchMcpTools: {
    verbs: ["Searching", "Searched"],
    noun: "MCP tools",
    suffix: toolSearchSuffix,
  },
  activateMcpTools: {
    verbs: ["Loading", "Loaded"],
    noun: "MCP tool",
    suffix: (_input, output) => activatedToolsSuffix(output),
  },
  listActiveMcpTools: {
    verbs: ["Checking", "Checked"],
    noun: "active MCP tools",
    suffix: (_input, output) => activeToolsSuffix(output),
  },
  deactivateMcpTools: {
    verbs: ["Unloading", "Unloaded"],
    noun: "MCP tools",
    suffix: (_input, output) => deactivatedToolsSuffix(output),
  },
  getPullRequests: {
    verbs: ["Fetching", "Fetched"],
    noun: "pull request",
    suffix: (input, output) => {
      const parsedOutput = pullRequestOutputSchema.safeParse(output);
      const repo = parsedOutput.success
        ? (parsedOutput.data.repository ?? parsedOutput.data.repo)
        : undefined;
      const number = parsedOutput.success
        ? (parsedOutput.data.number ?? parsedOutput.data.pull_number)
        : undefined;
      if (repo && number !== undefined) {
        return `${repo}#${number}`;
      }
      const parsedInput = pullRequestInputSchema.safeParse(input);
      const pullNumber = parsedInput.success
        ? parsedInput.data.pull_number
        : undefined;
      return pullNumber !== undefined ? `#${pullNumber}` : undefined;
    },
  },
  getReleaseByTag: {
    verbs: ["Fetching", "Fetched"],
    noun: "release",
    suffix: (input, output) => {
      const parsedOutput = releaseOutputSchema.safeParse(output);
      const repo = parsedOutput.success
        ? (parsedOutput.data.repository ?? parsedOutput.data.repo)
        : undefined;
      const tag = parsedOutput.success
        ? (parsedOutput.data.tag_name ?? parsedOutput.data.tag)
        : undefined;
      if (repo && tag) {
        return `${repo} · ${tag}`;
      }
      const parsedInput = releaseInputSchema.safeParse(input);
      return parsedInput.success ? parsedInput.data.tag : undefined;
    },
  },
  getCommitsByTimeframe: {
    verbs: ["Fetching", "Fetched"],
    noun: "commits",
    suffix: (input) => {
      const parsed = commitsByTimeframeInputSchema.safeParse(input);
      const days = parsed.success ? parsed.data.days : undefined;
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
    subtitle: memoryToolSubtitle,
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
  const parsed = mcpToolMetadataSchema.safeParse(toolMetadata);
  const notraMetadata = parsed.success ? parsed.data.notra : undefined;
  if (notraMetadata?.label) {
    return notraMetadata.label;
  }

  if (notraMetadata?.serverName && notraMetadata.toolName) {
    return `${notraMetadata.serverName} - ${notraMetadata.toolName}`;
  }

  return formatMcpToolName(toolName);
}

function getSubtitle({
  toolName,
  input,
  output,
  isStreaming,
  isError,
  isAwaitingApproval,
  toolMetadata,
}: {
  toolName: string;
  input: unknown;
  output: unknown;
  isStreaming: boolean;
  isError: boolean;
  isAwaitingApproval: boolean;
  toolMetadata?: unknown;
}): string {
  const copy = TOOL_COPY[toolName];
  const failurePrefix = isError ? "Failed to call" : undefined;
  if (!copy) {
    if (MCP_TOOL_NAME_REGEX.test(toolName)) {
      const label = getMcpToolLabel(toolName, toolMetadata);
      if (isAwaitingApproval) {
        return `Approve ${label}`;
      }
      if (failurePrefix) {
        return `${failurePrefix} ${label}`;
      }
      return isStreaming ? `Calling ${label}` : `Called ${label}`;
    }
    if (isAwaitingApproval) {
      return `Approve ${toolName}`;
    }
    if (failurePrefix) {
      return `${failurePrefix} ${toolName}`;
    }
    return isStreaming ? `Running ${toolName}` : `Ran ${toolName}`;
  }
  const suffix = copy.suffix?.(input, isStreaming ? undefined : output);
  if (isAwaitingApproval) {
    return suffix ? `Approve ${copy.noun} ${suffix}` : `Approve ${copy.noun}`;
  }
  if (isError) {
    return suffix ? `Failed ${copy.noun} ${suffix}` : `Failed ${copy.noun}`;
  }
  const subtitle = copy.subtitle?.({ input, output, isStreaming, isError });
  if (subtitle) {
    return subtitle;
  }
  const verb = copy.verbs[isStreaming ? 0 : 1];
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
  onApprove?: () => void;
  onDeny?: () => void;
  isMcp?: boolean;
  iconUrl?: string;
  toolMetadata?: unknown;
}

export function ChatToolBlock({
  toolName,
  state,
  input,
  output,
  onApprove,
  onDeny,
  isMcp = false,
  iconUrl,
  toolMetadata,
}: ChatToolBlockProps) {
  const isAwaitingApproval = state === "approval-requested";
  const [isOpen, setIsOpen] = useState(isAwaitingApproval);
  const isError = state === "output-error";
  const isStreaming =
    state === "input-streaming" || state === "input-available";

  useEffect(() => {
    if (isAwaitingApproval) {
      setIsOpen(true);
    }
  }, [isAwaitingApproval]);

  const subtitle = getSubtitle({
    toolName,
    input,
    output,
    isStreaming,
    isError,
    isAwaitingApproval,
    toolMetadata,
  });
  const hasInput = input != null;
  const hasOutput = output != null;
  const hasApprovalActions = isAwaitingApproval && (onApprove || onDeny);
  const hasDetails = hasInput || hasOutput || hasApprovalActions;
  let toolIcon: ReactNode = null;

  if (iconUrl) {
    toolIcon = (
      <Avatar className="size-4 shrink-0 rounded-sm after:hidden">
        <AvatarImage className="rounded-sm" src={iconUrl} />
        <AvatarFallback className="rounded-sm bg-transparent">
          <HugeiconsIcon className="size-3" icon={CpuIcon} />
        </AvatarFallback>
      </Avatar>
    );
  } else if (isMcp) {
    toolIcon = (
      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-medium text-[0.625rem] text-muted-foreground uppercase tracking-wide">
        MCP
      </span>
    );
  }

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger
        className="group flex w-full min-w-0 items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
        disabled={!hasDetails}
      >
        {toolIcon}
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
          {hasApprovalActions ? (
            <div className="flex flex-wrap items-center gap-2">
              {onApprove ? (
                <Button onClick={onApprove} size="sm" type="button">
                  <CheckIcon className="size-3.5" />
                  Allow
                </Button>
              ) : null}
              {onDeny ? (
                <Button
                  onClick={onDeny}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <XIcon className="size-3.5" />
                  Deny
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
