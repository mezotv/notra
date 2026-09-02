"use client";

import { GEO_CHAT_SKIN_SURFACE } from "@notra/geo-core/constants/geo";
import type { GeoChatSkin, GeoPromptResult } from "@notra/geo-core/types/geo";
import { formatAiTrafficTimestamp } from "@notra/geo-core/utils/ai-traffic";
import { perplexitySourcesFromExcerpt } from "@notra/geo-core/utils/geo-perplexity-sources";
import { MessageResponse } from "@notra/ui/components/ai-elements/message";
import { ChatgptActions } from "@notra/ui/components/brainless/chatgpt/chatgpt-actions";
import { ChatgptComposer } from "@notra/ui/components/brainless/chatgpt/chatgpt-composer";
import { ClaudeChatActions } from "@notra/ui/components/brainless/claude-chat/claude-chat-actions";
import { ClaudeChatComposer } from "@notra/ui/components/brainless/claude-chat/claude-chat-composer";
import { GeminiActions } from "@notra/ui/components/brainless/gemini/gemini-actions";
import { GeminiComposer } from "@notra/ui/components/brainless/gemini/gemini-composer";
import { PerplexityActions } from "@notra/ui/components/brainless/perplexity/perplexity-actions";
import { PerplexityComposer } from "@notra/ui/components/brainless/perplexity/perplexity-composer";
import type { PerplexitySearchSource } from "@notra/ui/types/perplexity";
import { useReducedMotion } from "motion/react";
import { type ReactNode, useMemo } from "react";

import { GeoAnswerSearch } from "@/components/geo/geo-answer-search";
import { GeoSkinMessage } from "@/components/geo/geo-skin-message";
import { useAnswerReplay } from "@/lib/hooks/use-answer-replay";
import { cn } from "@/lib/utils";
import type {
  AnswerReplayProgress,
  GeoPromptAnswerThreadProps,
} from "@/types/geo";
import {
  chatgptModelForEngine,
  claudeModelForEngine,
  geminiModelForEngine,
  perplexityModelForEngine,
} from "@/utils/geo-chat-model";
import { geoChatSkin } from "@/utils/geo-chat-skin";

const ANSWER_MARKDOWN_CLASS =
  "[&_h1]:mt-0 [&_h1]:mb-2 [&_h1]:text-[1.15em] [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-[1.05em] [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-[1em] [&_h3]:font-semibold [&_p]:my-2.5 [&_ul]:my-2.5 [&_ol]:my-2.5";

function ignoreFollowUp(_text: string): void {
  // The composer is visual chrome; follow-ups are not sent.
}

function emptyAnswerCopy(mentioned: boolean): string {
  return mentioned
    ? "Mentioned, but no answer was captured."
    : "This engine did not mention you.";
}

function displayAnswer(result: { answer: string; excerpt: string }): string {
  return result.answer.trim() || result.excerpt.trim();
}

function threadSources(
  result: GeoPromptResult,
  answer: string
): PerplexitySearchSource[] {
  if (result.sources.length > 0) {
    return result.sources.map((source) => ({
      title: source.title ?? source.domain ?? source.url,
      domain: source.domain ?? "",
      url: source.url,
      verified: true,
    }));
  }

  return perplexitySourcesFromExcerpt(answer);
}

function emptyAnswerClassName(skin: GeoChatSkin): string {
  if (skin === "perplexity") {
    return "font-serif text-[17.5px] leading-[1.75]";
  }
  if (skin === "claude") {
    return "font-sans text-[15px] leading-6";
  }
  return "text-[15px] leading-7";
}

export function AnswerMarkdown({
  text,
  skin,
  mode = "static",
}: {
  text: string;
  skin: GeoChatSkin;
  mode?: "static" | "streaming";
}) {
  return (
    <MessageResponse
      className={cn(
        ANSWER_MARKDOWN_CLASS,
        skin === "claude" &&
          "[&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif",
        skin === "perplexity" &&
          "font-serif [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif"
      )}
      mode={mode}
    >
      {text}
    </MessageResponse>
  );
}

function AssistantBody({
  answer,
  mentioned,
  mode = "static",
  skin,
}: {
  answer: string;
  mentioned: boolean;
  mode?: "static" | "streaming";
  skin: GeoChatSkin;
}) {
  if (answer.length > 0) {
    return <AnswerMarkdown mode={mode} skin={skin} text={answer} />;
  }

  return (
    <p className={cn("text-muted-foreground", emptyAnswerClassName(skin))}>
      {emptyAnswerCopy(mentioned)}
    </p>
  );
}

function assistantActions({
  skin,
  excerpt,
  timestamp,
  sources,
}: {
  skin: GeoChatSkin;
  excerpt: string;
  timestamp: string;
  sources: PerplexitySearchSource[];
}) {
  if (excerpt.length === 0) {
    return undefined;
  }
  if (skin === "claude") {
    return <ClaudeChatActions text={excerpt} timestamp={timestamp} />;
  }
  if (skin === "gemini") {
    return <GeminiActions text={excerpt} />;
  }
  if (skin === "perplexity") {
    return <PerplexityActions sources={sources} text={excerpt} />;
  }
  return <ChatgptActions text={excerpt} />;
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
  if (skin === "perplexity") {
    return (
      <PerplexityComposer
        defaultModel={perplexityModelForEngine(engine)}
        onSend={ignoreFollowUp}
        placeholder="Ask a follow-up"
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
  answer,
  mentioned,
  skin,
  timestamp,
  search,
  sources,
  progress,
}: {
  prompt: string;
  answer: string;
  mentioned: boolean;
  skin: GeoChatSkin;
  timestamp: string;
  search: ReactNode;
  sources: PerplexitySearchSource[];
  progress: AnswerReplayProgress | null;
}) {
  const stage = progress?.stage ?? null;
  const answerDone = progress === null;
  const showThinking = stage === "thinking";
  const showAnswer = answerDone || stage === "typing";
  const answerText = stage === "typing" ? (progress?.typed ?? "") : answer;

  return (
    <>
      <GeoSkinMessage from="user" skin={skin}>
        {prompt}
      </GeoSkinMessage>
      {(showThinking || showAnswer) && (
        <GeoSkinMessage
          actions={
            answerDone
              ? assistantActions({
                  excerpt: answer,
                  skin,
                  sources,
                  timestamp,
                })
              : undefined
          }
          from="assistant"
          search={showAnswer ? search : undefined}
          skin={skin}
        >
          {showThinking ? (
            <p
              className={cn(
                "text-muted-foreground animate-pulse",
                skin === "perplexity"
                  ? "font-serif text-[17.5px]"
                  : "text-[15px]"
              )}
            >
              Thinking…
            </p>
          ) : (
            <AssistantBody
              answer={answerText}
              mentioned={mentioned}
              mode={answerDone ? "static" : "streaming"}
              skin={skin}
            />
          )}
        </GeoSkinMessage>
      )}
    </>
  );
}

export function GeoPromptAnswerThread({
  prompt,
  result,
}: GeoPromptAnswerThreadProps) {
  const skin = geoChatSkin(result.engine);
  const answer = displayAnswer(result);
  const replayTurns = useMemo(() => [{ answer }], [answer]);
  const reducedMotion = useReducedMotion();
  const progress = useAnswerReplay(replayTurns, 1, Boolean(reducedMotion));
  const sources = threadSources(result, answer);
  const hasRecordedSearch =
    result.searchQueries.length > 0 || result.sources.length > 0;
  const search = hasRecordedSearch ? (
    <GeoAnswerSearch
      queries={result.searchQueries}
      skin={skin}
      sources={sources}
    />
  ) : undefined;
  const timestamp = formatAiTrafficTimestamp(result.lastCheckedAt);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        GEO_CHAT_SKIN_SURFACE[skin]
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-8">
          <ThreadMessages
            answer={answer}
            mentioned={result.mentioned}
            prompt={prompt}
            progress={progress}
            search={search}
            skin={skin}
            sources={sources}
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
