"use client";

import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { Button } from "@/components/button";
import { EngineIcon } from "@/components/geo/engine-icon";
import { GEO_SEARCH_LABEL } from "@/constants/geo";
import { cn } from "@/lib/utils";
import type { PromptEngineSwitcherProps } from "@/types/geo";
import {
  engineAnswerMode,
  formatEngineFamily,
  formatEngineWithMode,
  sharedEngineAnswerMode,
} from "@/utils/geo-charts";
import { adjacentPromptEngine } from "@/utils/geo-prompt-engines";

const PILL_TRANSITION = { type: "spring", bounce: 0, duration: 0.3 } as const;
const INSTANT = { duration: 0 } as const;

function engineLabel(engine: string, answerMode: string | null): string {
  return answerMode ? formatEngineFamily(engine) : formatEngineWithMode(engine);
}

export function PromptEngineSwitcher({
  results,
  active,
  onChange,
}: PromptEngineSwitcherProps) {
  const engines = results.map((result) => result.engine);
  const answerMode = sharedEngineAnswerMode(engines);
  const layoutId = useId();
  const reduceMotion = useReducedMotion();
  const pillTransition = reduceMotion ? INSTANT : PILL_TRANSITION;
  const activeIndex = engines.indexOf(active.engine);

  return (
    <div className="flex items-start gap-3">
      <LayoutGroup id={layoutId}>
        <div
          aria-label="Engines"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-1 p-0.5"
          role="tablist"
        >
          {results.map((result, index) => {
            const selected = result.engine === active.engine;
            const label = engineLabel(result.engine, answerMode);
            const family = formatEngineFamily(result.engine);
            const showSearchIcon =
              answerMode === null && engineAnswerMode(result.engine) !== null;
            return (
              <button
                aria-label={label}
                aria-selected={selected}
                className={cn(
                  "relative inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm",
                  "transition-[color,transform] duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                  "active:scale-[0.96]",
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
                  <span className="inline-flex items-center gap-1">
                    <span>{family}</span>
                    {showSearchIcon ? (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <span className="inline-flex shrink-0 cursor-default" />
                          }
                        >
                          <HugeiconsIcon
                            aria-hidden="true"
                            className="size-3 shrink-0"
                            icon={Search01Icon}
                            strokeWidth={2}
                          />
                        </TooltipTrigger>
                        <TooltipContent>{GEO_SEARCH_LABEL}</TooltipContent>
                      </Tooltip>
                    ) : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>
      {results.length > 1 ? (
        <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
          <Button
            aria-label="Previous engine"
            onClick={() =>
              onChange(adjacentPromptEngine(engines, active.engine, -1), -1)
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
              onChange(adjacentPromptEngine(engines, active.engine, 1), 1)
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
