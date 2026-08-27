"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type KeyboardEvent, useState } from "react";

import { GeoPromptAnswerThread } from "@/components/geo/geo-prompt-answer-thread";
import { PromptEngineSwitcher } from "@/components/geo/prompt-engine-switcher";
import { EASE_OUT } from "@/lib/ease";
import type {
  GeoPromptResult,
  GeoPromptTableRow,
  PromptDetailDialogProps,
} from "@/types/geo";
import { formatAiTrafficTimestamp } from "@/utils/ai-traffic";
import { sharedEngineAnswerMode } from "@/utils/geo-charts";
import { adjacentPromptEngine } from "@/utils/geo-prompt-engines";
import { geoScanEmptyMessage } from "@/utils/geo-scan";

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

  function handleArrowNavigation(event: KeyboardEvent<HTMLElement>) {
    if (
      results.length < 2 ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight") ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.closest("input, textarea, select, [contenteditable='true']"))
    ) {
      return;
    }

    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    selectEngine(
      adjacentPromptEngine(engines, active?.engine ?? engine, delta),
      delta
    );
  }

  return (
    <ResponsiveDialogContent
      className="flex h-[min(calc(100vh-2rem),900px)] max-h-[calc(100vh-2rem)] w-full max-w-[min(calc(100vw-2rem),72rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),72rem)]"
      drawerClassName="h-[94svh] max-h-[94svh]"
      onKeyDown={handleArrowNavigation}
    >
      <ResponsiveDialogHeader className="shrink-0 gap-3 overflow-visible px-6 pt-5 pr-12 pb-3">
        <ResponsiveDialogTitle className="text-xl leading-snug font-semibold text-balance">
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
          <PromptEngineSwitcher
            active={active}
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
              <p className="text-muted-foreground text-center text-sm text-pretty">
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
