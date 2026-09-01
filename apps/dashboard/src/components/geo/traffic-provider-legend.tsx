"use client";

import { Robot01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useId } from "react";

import { buildChartCss } from "@/components/evilcharts/ui/echarts-chart";
import { EngineIcon } from "@/components/geo/engine-icon";
import { cn } from "@/lib/utils";
import type { TrafficProviderLegendProps } from "@/types/geo";

export function TrafficProviderLegend({
  config,
  series,
  hiddenKeys,
  onToggle,
}: TrafficProviderLegendProps) {
  const rawId = useId();
  const legendId = `legend-${rawId.replace(/:/g, "")}`;
  const css = buildChartCss(legendId, config);

  return (
    <div
      className="mt-3 flex flex-wrap items-center gap-1.5"
      data-chart={legendId}
    >
      <style>{css}</style>
      {series.map((entry) => {
        const hidden = hiddenKeys.has(entry.key);
        return (
          <button
            aria-pressed={!hidden}
            className={cn(
              "border-border flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2 text-xs transition-all",
              hidden
                ? "text-muted-foreground border-transparent opacity-50 hover:opacity-80"
                : "bg-card text-foreground hover:bg-muted"
            )}
            key={entry.key}
            onClick={() => onToggle(entry.key)}
            type="button"
          >
            {entry.icon === null ? (
              <HugeiconsIcon
                aria-hidden="true"
                className="text-muted-foreground size-3.5 shrink-0"
                icon={Robot01Icon}
              />
            ) : (
              <EngineIcon className="size-3.5" engine={entry.icon} />
            )}
            <span className={cn(hidden && "line-through")}>{entry.label}</span>
          </button>
        );
      })}
    </div>
  );
}
