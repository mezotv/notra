"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shimmer } from "@notra/ui/components/ai-elements/shimmer";
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

function getNumber(value: unknown, key: string): number | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }
  const entry = (value as Record<string, unknown>)[key];
  return typeof entry === "number" ? entry : undefined;
}

interface ToolCopy {
  verbs: readonly [present: string, past: string];
  noun: string;
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

function quotedSuffix(
  input: unknown,
  keys: readonly string[]
): string | undefined {
  for (const key of keys) {
    const value = getString(input, key);
    if (value) {
      return `"${value}"`;
    }
  }
  return undefined;
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
};

function getSubtitle({
  toolName,
  input,
  output,
  isStreaming,
}: {
  toolName: string;
  input: unknown;
  output: unknown;
  isStreaming: boolean;
}): string {
  const copy = TOOL_COPY[toolName];
  if (!copy) {
    return isStreaming ? `Running ${toolName}` : `Ran ${toolName}`;
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

  const parts: Array<{ text: string; className: string }> = [];
  let lastIndex = 0;
  for (const match of text.matchAll(JSON_TOKEN_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, start),
        className: "text-muted-foreground/70",
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
    parts.push({ text: token, className });
    lastIndex = start + token.length;
  }
  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      className: "text-muted-foreground/70",
    });
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border/50 bg-muted/30 p-3 font-mono text-[0.75rem] leading-relaxed">
      {parts.map((part, index) => (
        <span className={part.className} key={index}>
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
}

export function ChatToolBlock({
  toolName,
  state,
  input,
  output,
}: ChatToolBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isStreaming =
    state === "input-streaming" || state === "input-available";
  const subtitle = getSubtitle({ toolName, input, output, isStreaming });
  const hasInput = input != null;
  const hasOutput = output != null;
  const hasDetails = hasInput || hasOutput;

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger
        className="group flex w-full items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground"
        disabled={!hasDetails}
      >
        {isStreaming ? (
          <Shimmer as="span" className="text-sm leading-5" duration={1.8}>
            {subtitle}
          </Shimmer>
        ) : (
          <span className="inline-block leading-5">{subtitle}</span>
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
