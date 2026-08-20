"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { Button } from "@notra/ui/components/ui/button";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { useId, useState } from "react";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GeoPromptAnswerThread } from "@/components/geo/geo-prompt-answer-thread";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";
import type {
  GeoPromptResult,
  GeoPromptTableRow,
  PromptDetailDialogProps,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import {
  formatEngineFamily,
  formatEngineWithMode,
  sharedEngineAnswerMode,
} from "@/utils/geo-charts";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

const PILL_TRANSITION = { type: "spring", bounce: 0, duration: 0.3 } as const;
const INSTANT = { duration: 0 } as const;
const SLIDE_PX = 18;

function threadVariants(reduceMotion: boolean) {
  return {
    enter: (direction: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : direction * SLIDE_PX,
    }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({
      opacity: 0,
      x: reduceMotion ? 0 : direction * -SLIDE_PX,
    }),
  };
}

function engineLabel(engine: string, answerMode: string | null): string {
  return answerMode ? formatEngineFamily(engine) : formatEngineWithMode(engine);
}

function adjacentEngine(
  engines: readonly string[],
  current: string,
  delta: number
): string {
  if (engines.length === 0) {
    return current;
  }
  const index = engines.indexOf(current);
  const from = index === -1 ? 0 : index;
  const next = (from + delta) % engines.length;
  const wrapped = next < 0 ? next + engines.length : next;
  return engines[wrapped] ?? current;
}

function latestPromptCheckAt(
  results: readonly GeoPromptResult[]
): string | null {
  let latest: string | null = null;
  for (const result of results) {
    if (!latest || result.lastCheckedAt > latest) {
      latest = result.lastCheckedAt;
    }
  }
  return latest;
}

function EngineSwitcher({
  results,
  active,
  answerMode,
  onChange,
}: {
  results: GeoPromptResult[];
  active: GeoPromptResult;
  answerMode: string | null;
  onChange: (engine: string, direction: number) => void;
}) {
  const engines = results.map((result) => result.engine);
  const layoutId = useId();
  const reduceMotion = useReducedMotion();
  const pillTransition = reduceMotion ? INSTANT : PILL_TRANSITION;
  const activeIndex = engines.indexOf(active.engine);

  return (
    <div className="flex items-center gap-3">
      <LayoutGroup id={layoutId}>
        <div
          aria-label="Engines"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
          role="tablist"
        >
          {results.map((result, index) => {
            const selected = result.engine === active.engine;
            const label = engineLabel(result.engine, answerMode);
            return (
              <button
                aria-label={label}
                aria-selected={selected}
                className={cn(
                  "relative inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm transition-[color,transform] duration-150 ease-out active:scale-[0.96]",
                  selected
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                key={result.engine}
                onClick={() =>
                  onChange(result.engine, index >= activeIndex ? 1 : -1)
                }
                role="tab"
                type="button"
              >
                {selected ? (
                  <motion.span
                    className="absolute inset-0 rounded-full bg-muted"
                    layoutId="geo-engine-pill"
                    transition={pillTransition}
                  />
                ) : null}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <EngineIcon className="size-3.5" engine={result.engine} />
                  <span>{label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {results.length > 1 ? (
        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            aria-label="Previous engine"
            onClick={() =>
              onChange(adjacentEngine(engines, active.engine, -1), -1)
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
          </Button>
          <Button
            aria-label="Next engine"
            onClick={() =>
              onChange(adjacentEngine(engines, active.engine, 1), 1)
            }
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PromptAnswerPage({
  row,
  isScanning = false,
}: {
  row: GeoPromptTableRow;
  isScanning?: boolean;
}) {
  const results = row.results;
  const engines = results.map((result) => result.engine);
  const [engine, setEngine] = useState(engines[0] ?? "");
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();
  const answerMode = sharedEngineAnswerMode(engines);
  const latestCheck = latestPromptCheckAt(results);
  const active =
    results.find((result) => result.engine === engine) ?? results[0] ?? null;
  const threadTransition = reduceMotion
    ? INSTANT
    : { duration: 0.28, ease: EASE_OUT };

  function selectEngine(next: string, nextDirection: number) {
    if (next === engine) {
      return;
    }
    setDirection(nextDirection);
    setEngine(next);
  }

  return (
    <ResponsiveDialogContent
      className="flex h-[min(calc(100vh-2rem),900px)] max-h-[calc(100vh-2rem)] w-full max-w-[min(calc(100vw-2rem),72rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),72rem)]"
      drawerClassName="h-[94svh] max-h-[94svh]"
    >
      <ResponsiveDialogHeader className="shrink-0 gap-3 overflow-x-hidden px-6 pt-5 pr-12 pb-3">
        <ResponsiveDialogTitle className="text-balance font-semibold text-xl leading-snug">
          {row.prompt}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">
          {answerMode
            ? `Latest ${answerMode} answer from each engine`
            : "Latest answer from each engine"}
        </ResponsiveDialogDescription>
        {latestCheck ? (
          <p className="text-muted-foreground text-sm">
            {formatAiTrafficTimestamp(latestCheck)}
          </p>
        ) : null}
        {results.length > 0 && active ? (
          <EngineSwitcher
            active={active}
            answerMode={answerMode}
            onChange={selectEngine}
            results={results}
          />
        ) : null}
      </ResponsiveDialogHeader>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <AnimatePresence custom={direction} initial={false}>
          {active ? (
            <motion.div
              animate="center"
              className="absolute inset-0 flex flex-col"
              custom={direction}
              exit="exit"
              initial="enter"
              key={active.engine}
              transition={threadTransition}
              variants={threadVariants(Boolean(reduceMotion))}
            >
              <GeoPromptAnswerThread prompt={row.prompt} result={active} />
            </motion.div>
          ) : (
            <div className="flex h-full min-h-0 items-center justify-center px-6">
              <p className="text-pretty text-center text-muted-foreground text-sm">
                {geoScanEmptyMessage(
                  isScanning,
                  "Run a scan to see how engines answer this"
                )}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ResponsiveDialogContent>
  );
}

export function PromptDetailDialog({
  open,
  onOpenChange,
  row,
  isScanning = false,
}: PromptDetailDialogProps) {
  if (!row) {
    return null;
  }

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <PromptAnswerPage isScanning={isScanning} key={row.id} row={row} />
    </ResponsiveDialog>
  );
}
