"use client";

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import {
  TooltipContent,
  TooltipTrigger,
} from "@notra/ui/components/ui/tooltip";
import { useMemo, useState } from "react";
import { DelayedTooltip } from "@/components/delayed-tooltip";
import {
  InstrumentEmpty,
  InstrumentModule,
} from "@/components/instrument/instrument-module";
import {
  ANALYTICS_TOOLTIP_DELAY_MS,
  POSTING_ACTIVITY_BAR_CLASSES,
  POSTING_ACTIVITY_LABELS,
} from "@/constants/analytics";
import { cn } from "@/lib/utils";
import type { PostingPerformanceCardProps } from "@/types/analytics";
import {
  buildPostingHeatmap,
  buildPostingTimeSlots,
  findBestPostingSlot,
  formatHourRange,
  formatMetric,
  postingSlotHeightPercent,
  timezoneAbbreviation,
  WEEKDAY_LABELS,
} from "@/utils/analytics-charts";

export function PostingPerformanceCard({
  points,
  action,
}: PostingPerformanceCardProps) {
  const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null);

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

  return (
    <InstrumentModule
      action={action}
      description="When your posts earn the most engagement"
      eyebrow="Best time to post"
      variant="panel"
    >
      {hasData ? (
        <div className="flex h-56 flex-col justify-center gap-4">
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
                <div className="flex flex-col gap-1">
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
                          <DelayedTooltip
                            delay={ANALYTICS_TOOLTIP_DELAY_MS}
                            key={cell.hour}
                          >
                            <TooltipTrigger
                              render={
                                <button
                                  aria-label={`${WEEKDAY_LABELS[dayIndex]} ${formatHourRange(cell.hour)}: ${POSTING_ACTIVITY_LABELS[cell.level]}`}
                                  className={cn(
                                    "h-3.5 min-w-0 flex-1 cursor-pointer rounded-[0.1875rem]",
                                    POSTING_ACTIVITY_BAR_CLASSES[cell.level]
                                  )}
                                  onClick={() =>
                                    setSelectedWeekday(cell.weekday)
                                  }
                                  type="button"
                                />
                              }
                            />
                            <TooltipContent>
                              <p className="font-mono text-xs tabular-nums">
                                {WEEKDAY_LABELS[dayIndex]}{" "}
                                {formatHourRange(cell.hour)}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {POSTING_ACTIVITY_LABELS[cell.level]}
                                {cell.posts > 0 &&
                                  ` · ${cell.posts.toLocaleString()} ${cell.posts === 1 ? "post" : "posts"}`}
                              </p>
                            </TooltipContent>
                          </DelayedTooltip>
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
                <div className="flex h-14 items-end gap-1">
                  {slots.map((slot) => (
                    <DelayedTooltip
                      delay={ANALYTICS_TOOLTIP_DELAY_MS}
                      key={slot.hour}
                    >
                      <TooltipTrigger
                        render={
                          <button
                            aria-label={`${formatHourRange(slot.hour)}: ${POSTING_ACTIVITY_LABELS[slot.level]}`}
                            className={cn(
                              "min-w-0 flex-1 cursor-pointer rounded-full",
                              POSTING_ACTIVITY_BAR_CLASSES[slot.level],
                              best?.hour === slot.hour &&
                                "ring-2 ring-ring ring-offset-1 ring-offset-card"
                            )}
                            style={{
                              height: `${postingSlotHeightPercent(slot.avgEngagement, maxAvgEngagement)}%`,
                            }}
                            type="button"
                          />
                        }
                      />
                      <TooltipContent>
                        <p className="font-mono text-xs tabular-nums">
                          {formatHourRange(slot.hour)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {POSTING_ACTIVITY_LABELS[slot.level]}
                          {slot.posts > 0 &&
                            ` · ${slot.posts.toLocaleString()} ${slot.posts === 1 ? "post" : "posts"}`}
                        </p>
                      </TooltipContent>
                    </DelayedTooltip>
                  ))}
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[0.6875rem] text-muted-foreground tabular-nums">
                  <span>0:00</span>
                  <span>12:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </>
          )}
        </div>
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
