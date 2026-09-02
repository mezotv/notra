"use client";

import { ChatgptMessage } from "@notra/ui/components/brainless/chatgpt/chatgpt-message";
import { ClaudeChatMessage } from "@notra/ui/components/brainless/claude-chat/claude-chat-message";
import { GeminiMessage } from "@notra/ui/components/brainless/gemini/gemini-message";
import { PerplexityMessage } from "@notra/ui/components/brainless/perplexity/perplexity-message";

import type { GeoSkinMessageProps } from "@/types/geo";

export function GeoSkinMessage({
  skin,
  from,
  search,
  actions,
  children,
}: GeoSkinMessageProps) {
  if (skin === "claude") {
    return (
      <ClaudeChatMessage actions={actions} from={from} search={search}>
        {children}
      </ClaudeChatMessage>
    );
  }
  if (skin === "gemini") {
    return (
      <GeminiMessage actions={actions} from={from} status={search}>
        {children}
      </GeminiMessage>
    );
  }
  if (skin === "perplexity") {
    return (
      <PerplexityMessage actions={actions} from={from} search={search}>
        {children}
      </PerplexityMessage>
    );
  }
  return (
    <ChatgptMessage actions={actions} from={from} reasoning={search}>
      {children}
    </ChatgptMessage>
  );
}
