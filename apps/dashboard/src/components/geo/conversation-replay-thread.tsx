"use client";

import { GEO_CHAT_SKIN_SURFACE } from "@notra/geo-core/constants/geo";
import type {
  GeoChatSkin,
  GeoSequenceTurnResult,
} from "@notra/geo-core/types/geo";
import { perplexitySourcesFromStoredOrExcerpt } from "@notra/geo-core/utils/geo-perplexity-sources";
import {
  PerplexitySearch,
  type PerplexitySearchSource,
} from "@notra/ui/components/brainless/perplexity/perplexity-search";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { AnswerMarkdown } from "@/components/geo/geo-prompt-answer-thread";
import { GeoSkinMessage } from "@/components/geo/geo-skin-message";
import { cn } from "@/lib/utils";
import type { ConversationReplayThreadProps } from "@/types/geo";
import { geoChatSkin } from "@/utils/geo-chat-skin";

const USER_PAUSE_MS = 420;
const THINKING_MS = 1400;
const TURN_PAUSE_MS = 480;
const REDUCED_MOTION_PAUSE_MS = 80;
const TYPE_INTERVAL_MS = 24;
const MIN_TYPE_INTERVAL_MS = 6;
const MAX_TYPE_TOTAL_MS = 9000;
const WHITESPACE_SPLIT = /(\s+)/;

type ReplayStage = "user" | "thinking" | "typing";

interface ReplayProgress {
  index: number;
  stage: ReplayStage;
  typed: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function typeInterval(tokenCount: number): number {
  if (tokenCount === 0) {
    return TYPE_INTERVAL_MS;
  }
  return Math.max(
    MIN_TYPE_INTERVAL_MS,
    Math.min(TYPE_INTERVAL_MS, Math.round(MAX_TYPE_TOTAL_MS / tokenCount))
  );
}

function useConversationReplay(
  turns: readonly GeoSequenceTurnResult[],
  playToken: number,
  reducedMotion: boolean
) {
  const [progress, setProgress] = useState<ReplayProgress | null>(null);

  useEffect(() => {
    if (playToken === 0) {
      return;
    }
    let cancelled = false;
    const pause = (ms: number) =>
      wait(reducedMotion ? REDUCED_MOTION_PAUSE_MS : ms);

    async function play() {
      const script = turns;
      for (let index = 0; index < script.length; index += 1) {
        if (cancelled) {
          return;
        }
        setProgress({ index, stage: "user", typed: "" });
        await pause(USER_PAUSE_MS);
        if (cancelled) {
          return;
        }
        setProgress({ index, stage: "thinking", typed: "" });
        await pause(THINKING_MS);
        if (cancelled) {
          return;
        }
        const answer = script[index]?.answer ?? "";
        if (reducedMotion) {
          setProgress({ index, stage: "typing", typed: answer });
        } else {
          const tokens = answer.split(WHITESPACE_SPLIT);
          const interval = typeInterval(tokens.length);
          let typed = "";
          for (const token of tokens) {
            typed += token;
            if (cancelled) {
              return;
            }
            setProgress({ index, stage: "typing", typed });
            await wait(interval);
          }
        }
        await pause(TURN_PAUSE_MS);
      }
      if (!cancelled) {
        setProgress(null);
      }
    }

    play();
    return () => {
      cancelled = true;
    };
  }, [playToken, reducedMotion, turns]);

  return progress;
}

function replaySources(turn: GeoSequenceTurnResult): PerplexitySearchSource[] {
  return perplexitySourcesFromStoredOrExcerpt(turn.sources, turn.answer);
}

function ThinkingIndicator({ skin }: { skin: GeoChatSkin }) {
  return (
    <p
      className={cn(
        "text-muted-foreground animate-pulse",
        skin === "perplexity" ? "font-serif text-[17.5px]" : "text-[15px]"
      )}
    >
      Thinking…
    </p>
  );
}

function SourcePills({ sources }: { sources: PerplexitySearchSource[] }) {
  if (sources.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {sources.map((source) => (
        <a
          className="border-border text-muted-foreground hover:text-foreground inline-flex items-center rounded-full border px-2 py-0.5 text-xs transition-colors"
          href={source.url}
          key={source.url ?? source.domain}
          rel="noopener noreferrer"
          target="_blank"
        >
          {source.domain}
        </a>
      ))}
    </div>
  );
}

function MentionPill({ turn }: { turn: GeoSequenceTurnResult }) {
  return (
    <p className="pt-1 text-xs">
      {turn.mentioned ? (
        <span className="text-geo-up font-medium">
          {turn.position !== null
            ? `Mentioned at #${turn.position}`
            : "Mentioned"}
        </span>
      ) : (
        <span className="text-muted-foreground">Not mentioned</span>
      )}
    </p>
  );
}

function ReplayTurn({
  turn,
  skin,
  progress,
  index,
}: {
  turn: GeoSequenceTurnResult;
  skin: GeoChatSkin;
  progress: ReplayProgress | null;
  index: number;
}) {
  const isReplaying = progress !== null;
  if (isReplaying && index > progress.index) {
    return null;
  }

  const isCurrent = isReplaying && index === progress.index;
  const stage = isCurrent ? progress.stage : null;
  const answerDone = !isCurrent || stage === null;
  const showThinking = stage === "thinking";
  const showAnswer = answerDone || stage === "typing";
  const answerText =
    isCurrent && stage === "typing" ? progress.typed : turn.answer;
  const sources = replaySources(turn);

  return (
    <>
      <GeoSkinMessage from="user" skin={skin}>
        {turn.prompt}
      </GeoSkinMessage>
      {(showThinking || showAnswer) && (
        <GeoSkinMessage
          from="assistant"
          search={
            skin === "perplexity" && showAnswer ? (
              <PerplexitySearch
                queries={[turn.prompt]}
                sources={sources}
                title="Web search"
              />
            ) : undefined
          }
          skin={skin}
        >
          {showThinking ? (
            <ThinkingIndicator skin={skin} />
          ) : (
            <>
              <AnswerMarkdown skin={skin} text={answerText} />
              {answerDone && skin !== "perplexity" && (
                <SourcePills sources={sources} />
              )}
              {answerDone && <MentionPill turn={turn} />}
            </>
          )}
        </GeoSkinMessage>
      )}
    </>
  );
}

export function ConversationReplayThread({
  engine,
  turns,
  playToken,
}: ConversationReplayThreadProps) {
  const skin = geoChatSkin(engine);
  const reducedMotion = useReducedMotion();
  const progress = useConversationReplay(
    turns,
    playToken,
    Boolean(reducedMotion)
  );

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        GEO_CHAT_SKIN_SURFACE[skin]
      )}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-8">
          {turns.map((turn, index) => (
            <ReplayTurn
              index={index}
              key={turn.turn}
              progress={progress}
              skin={skin}
              turn={turn}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
