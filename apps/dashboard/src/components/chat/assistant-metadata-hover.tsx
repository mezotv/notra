"use client";

import { Clock01Icon, CpuIcon, FlashIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { ClaudeAiIcon } from "@notra/ui/components/ui/svgs/claudeAiIcon";
import { Openai } from "@notra/ui/components/ui/svgs/openai";
import { OpenaiDark } from "@notra/ui/components/ui/svgs/openaiDark";
import type { ReactNode } from "react";
import type {
  ChatMessageMetadata,
  ChatModel,
  ThinkingLevel,
} from "@/types/chat";

const MODEL_LABELS = {
  "anthropic/claude-opus-4-7": "Claude Opus 4.7",
  "anthropic/claude-sonnet-4-6": "Claude Sonnet 4.6",
  "anthropic/claude-haiku-4-5": "Claude Haiku 4.5",
  "openai/gpt-5.4": "GPT-5.4",
} satisfies Record<ChatModel, string>;

const THINKING_LEVEL_LABELS: Record<ThinkingLevel, string | null> = {
  off: null,
  low: "Low",
  medium: "Medium",
  high: "High",
};

function getModelLabel(model: string): string {
  for (const [key, label] of Object.entries(MODEL_LABELS)) {
    if (key === model) {
      return label;
    }
  }
  return model;
}

function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)} ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 10) {
    return `${seconds.toFixed(1)} sec`;
  }
  return `${Math.round(seconds)} sec`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return String(tokens);
}

function ModelBadgeIcon({ model }: { model: string }) {
  if (model.startsWith("openai/")) {
    return (
      <>
        <Openai className="block size-3 dark:hidden" />
        <OpenaiDark className="hidden size-3 dark:block" />
      </>
    );
  }
  return <ClaudeAiIcon className="size-3" />;
}

interface AssistantMetadataHoverProps {
  metadata: ChatMessageMetadata | undefined;
}

export function AssistantMetadataHover({
  metadata,
}: AssistantMetadataHoverProps) {
  if (!metadata) {
    return null;
  }

  const items: ReactNode[] = [];

  if (metadata.model) {
    const modelLabel = getModelLabel(metadata.model);
    const thinkingLabel = metadata.thinkingLevel
      ? THINKING_LEVEL_LABELS[metadata.thinkingLevel]
      : null;

    items.push(
      <div className="flex items-center gap-1.5" key="model">
        <ModelBadgeIcon model={metadata.model} />
        <span>
          {modelLabel}
          {thinkingLabel ? ` (${thinkingLabel})` : ""}
        </span>
      </div>
    );
  }

  if (typeof metadata.tokensPerSecond === "number") {
    items.push(
      <div className="flex items-center gap-1" key="tps">
        <HugeiconsIcon className="size-3" icon={FlashIcon} />
        <span>{metadata.tokensPerSecond.toFixed(2)} tok/sec</span>
      </div>
    );
  }

  if (typeof metadata.totalTokens === "number") {
    items.push(
      <div className="flex items-center gap-1" key="tokens">
        <HugeiconsIcon className="size-3" icon={CpuIcon} />
        <span>{formatTokens(metadata.totalTokens)} tokens</span>
      </div>
    );
  }

  if (typeof metadata.ttftMs === "number") {
    items.push(
      <div className="flex items-center gap-1" key="ttft">
        <HugeiconsIcon className="size-3" icon={Clock01Icon} />
        <span>Time-to-First: {formatDuration(metadata.ttftMs)}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100">
      {items}
    </div>
  );
}
