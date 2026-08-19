"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { domAnimation, LazyMotion, m, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { CursorTooltip } from "@/components/analytics/cursor-tooltip";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import {
  POSTING_ACTIVITY_BAR_CLASSES,
  POSTING_ACTIVITY_LABELS,
} from "@/constants/analytics";
import { cn } from "@/lib/utils";
import type {
  CursorTipState,
  PostingPerformanceCardProps,
} from "@/types/analytics";
import {
  buildPostingHeatmap,
  buildPostingTimeSlots,
  cursorTipPosition,
  findBestPostingSlot,
  formatHourRange,
  formatMetric,
  postingSlotHeightPercent,
  timezoneAbbreviation,
  WEEKDAY_LABELS,
} from "@/utils/analytics-charts";

const PANEL_SLIDE = 24;
const PANEL_TRANSITION = {
  type: "spring",
  stiffness: 460,
  damping: 38,
} as const;

export function PostingPerformanceCard({
  points,
  action,
}: PostingPerformanceCardProps) {
  const reduceMotion = useReducedMotion();
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);
  const [tip, setTip] = useState<CursorTipState | null>(null);

  const heatmap = useMemo(() => buildPostingHeatmap(points), [points]);
  const slots = useMemo(
    () => buildPostingTimeSlots(points, selectedWeekday),
    [points, selectedWeekday]
  );
  const best = useMemo(
    () => findBestPostingSlot(points, selectedWeekday),
    [points, selectedWeekday]
  );

  const hasData = points.some((point) => point.posts > 0);
  const maxAvgEngagement = slots.reduce(
    (max, slot) => Math.max(max, slot.avgEngagement),
    0
  );
  const selectedLabel =
    selectedWeekday === null ? null : WEEKDAY_LABELS[selectedWeekday - 1];
  const direction = selectedWeekday === null ? -1 : 1;
  const slide = reduceMotion ? 0 : PANEL_SLIDE;

  return (
    <InstrumentModule
      action={action}
      description="When your posts earn the most engagement"
      eyebrow="Best time to post"
      variant="panel"
    >
      {hasData ? (
        <LazyMotion features={domAnimation}>
          <div className="relative h-56">
            <m.div
              animate={{ x: 0, opacity: 1 }}
              className="flex h-full flex-col justify-center gap-4"
              initial={
                reduceMotion ? false : { x: direction * slide, opacity: 0 }
              }
              key={selectedWeekday === null ? "week" : "day"}
              transition={PANEL_TRANSITION}
            >
              {selectedWeekday === null ? (
                <>
                  {best && (
                    <div>
                      <p className="font-mono text-xl tabular-nums tracking-tight">
                        {best.weekday} {formatHourRange(best.hour)}
                        <span className="ml-2 text-muted-foreground text-sm">
                          {timezoneAbbreviation()}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Highest average engagement (
                        {formatMetric(best.avgEngagement)} per post)
                      </p>
                    </div>
                  )}
                  <div>
                    <div
                      className="flex cursor-pointer flex-col gap-1"
                      onPointerLeave={() => setTip(null)}
                      onPointerMove={(event) =>
                        setTip((previous) =>
                          previous
                            ? { ...previous, ...cursorTipPosition(event) }
                            : previous
                        )
                      }
                    >
                      {heatmap.map((row, dayIndex) => (
                        <div
                          className="flex items-center gap-2"
                          key={WEEKDAY_LABELS[dayIndex]}
                        >
                          <span className="w-7 shrink-0 font-mono text-[0.625rem] text-muted-foreground">
                            {WEEKDAY_LABELS[dayIndex]}
                          </span>
                          <div className="flex min-w-0 flex-1 gap-0.5">
                            {row.map((cell) => (
                              <button
                                aria-label={`${WEEKDAY_LABELS[dayIndex]} ${formatHourRange(cell.hour)}: ${POSTING_ACTIVITY_LABELS[cell.level]}`}
                                className={cn(
                                  "h-3.5 min-w-0 flex-1 cursor-pointer rounded-[0.1875rem]",
                                  POSTING_ACTIVITY_BAR_CLASSES[cell.level]
                                )}
                                key={cell.hour}
                                onClick={() => setSelectedWeekday(cell.weekday)}
                                onPointerMove={(event) =>
                                  setTip({
                                    ...cursorTipPosition(event),
                                    title: `${WEEKDAY_LABELS[dayIndex]} ${formatHourRange(cell.hour)}`,
                                    detail: `${POSTING_ACTIVITY_LABELS[cell.level]}${cell.posts > 0 ? ` · ${cell.posts.toLocaleString()} ${cell.posts === 1 ? "post" : "posts"}` : ""}`,
                                  })
                                }
                                type="button"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 ml-9 flex justify-between font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
                      <span>0:00</span>
                      <span>12:00</span>
                      <span>24:00</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Button
                      className="cursor-pointer"
                      onClick={() => setSelectedWeekday(null)}
                      size="xs"
                      variant="ghost"
                    >
                      <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
                      Week
                    </Button>
                  </div>
                  {best && (
                    <div>
                      <p className="font-mono text-xl tabular-nums tracking-tight">
                        {selectedLabel} {formatHourRange(best.hour)}
                        <span className="ml-2 text-muted-foreground text-sm">
                          {timezoneAbbreviation()}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Highest average engagement (
                        {formatMetric(best.avgEngagement)} per post)
                      </p>
                    </div>
                  )}
                  <div>
                    <div
                      className="flex h-14 items-end gap-1"
                      onPointerLeave={() => setTip(null)}
                      onPointerMove={(event) =>
                        setTip((previous) =>
                          previous
                            ? { ...previous, ...cursorTipPosition(event) }
                            : previous
                        )
                      }
                    >
                      {slots.map((slot) => {
                        const isBest = best?.hour === slot.hour;
                        return (
                          <button
                            aria-label={`${formatHourRange(slot.hour)}: ${POSTING_ACTIVITY_LABELS[slot.level]}`}
                            className={cn(
                              "min-w-0 flex-1 rounded-full",
                              isBest &&
                                "ring-2 ring-ring ring-offset-1 ring-offset-card"
                            )}
                            key={slot.hour}
                            onPointerMove={(event) =>
                              setTip({
                                ...cursorTipPosition(event),
                                title: formatHourRange(slot.hour),
                                detail: `${POSTING_ACTIVITY_LABELS[slot.level]}${slot.posts > 0 ? ` · ${slot.posts.toLocaleString()} ${slot.posts === 1 ? "post" : "posts"}` : ""}`,
                              })
                            }
                            style={{
                              height: `${postingSlotHeightPercent(slot.avgEngagement, maxAvgEngagement)}%`,
                            }}
                            type="button"
                          >
                            <span
                              className={cn(
                                "block h-full w-full rounded-full",
                                POSTING_ACTIVITY_BAR_CLASSES[slot.level]
                              )}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
                      <span>0:00</span>
                      <span>12:00</span>
                      <span>24:00</span>
                    </div>
                  </div>
                </>
              )}
            </m.div>
            <CursorTooltip tip={tip} />
          </div>
        </LazyMotion>
      ) : (
        <InstrumentEmpty
          className="h-56"
          message="No posting data for this time frame"
          seed="Best time to post"
        />
      )}
    </InstrumentModule>
  );
}
