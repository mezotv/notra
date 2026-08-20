"use client";

import { MessageResponse } from "@notra/ui/components/ai-elements/message";
import { ChatgptActions } from "@notra/ui/components/brainless/chatgpt/chatgpt-actions";
import { ChatgptComposer } from "@notra/ui/components/brainless/chatgpt/chatgpt-composer";
import { ChatgptMessage } from "@notra/ui/components/brainless/chatgpt/chatgpt-message";
import { ClaudeChatActions } from "@notra/ui/components/brainless/claude-chat/claude-chat-actions";
import { ClaudeChatComposer } from "@notra/ui/components/brainless/claude-chat/claude-chat-composer";
import { ClaudeChatMessage } from "@notra/ui/components/brainless/claude-chat/claude-chat-message";
import { GeminiActions } from "@notra/ui/components/brainless/gemini/gemini-actions";
import { GeminiComposer } from "@notra/ui/components/brainless/gemini/gemini-composer";
import { GeminiMessage } from "@notra/ui/components/brainless/gemini/gemini-message";
import { cn } from "@/lib/utils";
import type { GeoChatSkin, GeoPromptAnswerThreadProps } from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import {
  chatgptModelForEngine,
  claudeModelForEngine,
  geminiModelForEngine,
} from "@/utils/geo-chat-model";
import { geoChatSkin } from "@/utils/geo-chat-skin";

const ANSWER_MARKDOWN_CLASS =
  "[&_h1]:mt-0 [&_h1]:mb-2 [&_h1]:text-[1.15em] [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-[1.05em] [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-[1em] [&_h3]:font-semibold [&_p]:my-2.5 [&_ul]:my-2.5 [&_ol]:my-2.5";

const SKIN_SURFACE: Record<GeoChatSkin, string> = {
  claude: "bg-[#faf9f5] dark:bg-[#1c1b18]",
  chatgpt: "bg-background",
  gemini: "bg-white dark:bg-[#1f1f1f]",
};

function ignoreFollowUp(_text: string): void {
  // The composer is visual chrome; follow-ups are not sent.
}

function emptyAnswerCopy(mentioned: boolean): string {
  return mentioned
    ? "Mentioned, but no excerpt was captured."
    : "This engine did not mention you.";
}

function AnswerMarkdown({ text, skin }: { text: string; skin: GeoChatSkin }) {
  return (
    <MessageResponse
      className={cn(
        ANSWER_MARKDOWN_CLASS,
        skin === "claude" &&
          "[&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif"
      )}
    >
      {text}
    </MessageResponse>
  );
}

function AssistantBody({
  excerpt,
  mentioned,
  skin,
}: {
  excerpt: string;
  mentioned: boolean;
  skin: GeoChatSkin;
}) {
  if (excerpt.length > 0) {
    return <AnswerMarkdown skin={skin} text={excerpt} />;
  }

  return (
    <p
      className={cn(
        "text-muted-foreground",
        skin === "claude"
          ? "font-sans text-[15px] leading-6"
          : "text-[15px] leading-7"
      )}
    >
      {emptyAnswerCopy(mentioned)}
    </p>
  );
}

function ClaudeAnswerThread({
  prompt,
  excerpt,
  mentioned,
  timestamp,
}: {
  prompt: string;
  excerpt: string;
  mentioned: boolean;
  timestamp: string;
}) {
  return (
    <>
      <ClaudeChatMessage from="user">{prompt}</ClaudeChatMessage>
      <ClaudeChatMessage
        actions={
          excerpt.length > 0 ? (
            <ClaudeChatActions text={excerpt} timestamp={timestamp} />
          ) : undefined
        }
        from="assistant"
      >
        <AssistantBody excerpt={excerpt} mentioned={mentioned} skin="claude" />
      </ClaudeChatMessage>
    </>
  );
}

function ChatgptAnswerThread({
  prompt,
  excerpt,
  mentioned,
}: {
  prompt: string;
  excerpt: string;
  mentioned: boolean;
}) {
  return (
    <>
      <ChatgptMessage from="user">{prompt}</ChatgptMessage>
      <ChatgptMessage
        actions={
          excerpt.length > 0 ? <ChatgptActions text={excerpt} /> : undefined
        }
        from="assistant"
      >
        <AssistantBody excerpt={excerpt} mentioned={mentioned} skin="chatgpt" />
      </ChatgptMessage>
    </>
  );
}

function GeminiAnswerThread({
  prompt,
  excerpt,
  mentioned,
}: {
  prompt: string;
  excerpt: string;
  mentioned: boolean;
}) {
  return (
    <>
      <GeminiMessage from="user">{prompt}</GeminiMessage>
      <GeminiMessage
        actions={
          excerpt.length > 0 ? <GeminiActions text={excerpt} /> : undefined
        }
        from="assistant"
      >
        <AssistantBody excerpt={excerpt} mentioned={mentioned} skin="gemini" />
      </GeminiMessage>
    </>
  );
}

function SkinComposer({ engine, skin }: { engine: string; skin: GeoChatSkin }) {
  if (skin === "claude") {
    return (
      <ClaudeChatComposer
        defaultModel={claudeModelForEngine(engine)}
        disclaimer="Claude can make mistakes. Please double-check responses."
        onSend={ignoreFollowUp}
        placeholder="Reply to Claude"
      />
    );
  }
  if (skin === "gemini") {
    return (
      <GeminiComposer
        defaultModel={geminiModelForEngine(engine)}
        disclaimer="Gemini can make mistakes, including about people."
        onSend={ignoreFollowUp}
        placeholder="Ask Gemini"
        privacyLabel="Privacy and Gemini"
      />
    );
  }
  return (
    <ChatgptComposer
      defaultModel={chatgptModelForEngine(engine)}
      onSend={ignoreFollowUp}
      placeholder="Ask anything"
    />
  );
}

function ThreadMessages({
  prompt,
  excerpt,
  mentioned,
  skin,
  timestamp,
}: {
  prompt: string;
  excerpt: string;
  mentioned: boolean;
  skin: GeoChatSkin;
  timestamp: string;
}) {
  if (skin === "claude") {
    return (
      <ClaudeAnswerThread
        excerpt={excerpt}
        mentioned={mentioned}
        prompt={prompt}
        timestamp={timestamp}
      />
    );
  }
  if (skin === "gemini") {
    return (
      <GeminiAnswerThread
        excerpt={excerpt}
        mentioned={mentioned}
        prompt={prompt}
      />
    );
  }
  return (
    <ChatgptAnswerThread
      excerpt={excerpt}
      mentioned={mentioned}
      prompt={prompt}
    />
  );
}

export function GeoPromptAnswerThread({
  prompt,
  result,
}: GeoPromptAnswerThreadProps) {
  const skin = geoChatSkin(result.engine);
  const excerpt = result.excerpt.trim();
  const timestamp = formatAiTrafficTimestamp(result.lastCheckedAt);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        SKIN_SURFACE[skin]
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-8">
          <ThreadMessages
            excerpt={excerpt}
            mentioned={result.mentioned}
            prompt={prompt}
            skin={skin}
            timestamp={timestamp}
          />
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-6 pt-1 pb-4">
        <SkinComposer engine={result.engine} key={result.engine} skin={skin} />
      </div>
    </div>
  );
}
