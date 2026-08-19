import type { TooltipComponentOption } from "echarts/components";
import {
  indicatorBackground,
  type ResolvedColors,
} from "@/components/evilcharts/ui/echarts-chart";
import type {
  TooltipBodyItem,
  TooltipLayout,
  TooltipValueFormatter,
} from "@/types/charts";

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip — the shared HTML shell/row primitives and the chart-agnostic option
// fields. The tooltip DOM lives inside `[data-chart={id}]`, so the injected
// `--color-*` vars and Tailwind classes resolve directly (no color read). Each
// chart composes its own rows but shares the shell/styling and base option.
// ─────────────────────────────────────────────────────────────────────────────

export type TooltipVariant = "default" | "frosted-glass";
export type TooltipRoundness = "sm" | "md" | "lg" | "xl";
// Tooltip anchoring: "variable" follows both axes (ECharts default, current
// behavior); "fixed" tracks the pointer's X (centered) but stays pinned near
// the top (fixed Y).
export type TooltipPosition = "fixed" | "variable";

const HTML_ESCAPE_PATTERN = /[&<>"']/g;
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

// Tooltip markup is injected as an HTML string by ECharts, so every
// user-derived string (series labels, axis labels, formatted values) must be
// escaped before interpolation — competitor names etc. come from user/LLM input.
export function escapeHtml(value: string): string {
  return value.replace(HTML_ESCAPE_PATTERN, (char) => HTML_ESCAPES[char] ?? char);
}

export const roundnessClass: Record<TooltipRoundness, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
};

export const tooltipVariantClass: Record<TooltipVariant, string> = {
  default: "bg-background",
  "frosted-glass": "bg-background/50 backdrop-blur-md",
};

// The standard series indicator swatch — a rounded square filled with the
// series' solid var or multi-stop gradient (indicatorBackground). A chart drops
// this into a tooltipRow's `indicatorHtml`.
export function tooltipIndicatorHtml(key: string, colorsCount: number): string {
  return `<div class="h-2.5 w-2.5 shrink-0 rounded-[2px]" style="background:${indicatorBackground(key, colorsCount)}"></div>`;
}

// One tooltip row: indicator swatch + label/value pair. `dimmed` is a class
// fragment (e.g. " opacity-30") appended to the row so the selection/hover dim
// stays byte-identical to the inlined markup.
export function tooltipRow({
  indicatorHtml,
  labelText,
  valueText,
  dimmed,
}: {
  indicatorHtml: string;
  labelText: string;
  valueText: string;
  dimmed: string;
}): string {
  return `<div class="flex w-full flex-wrap items-center gap-2${dimmed}">
          ${indicatorHtml}
          <div class="flex flex-1 items-center justify-between gap-4 leading-none">
            <span class="text-muted-foreground">${escapeHtml(labelText)}</span>
            <span class="text-foreground font-mono font-medium tabular-nums">${escapeHtml(valueText)}</span>
          </div>
        </div>`;
}

const TOOLTIP_BAR_TRACK = 100;
const TOOLTIP_BAR_MIN = 2;

export function formatTooltipValue(
  value: unknown,
  formatter?: TooltipValueFormatter
): { numeric: number | null; text: string } {
  if (typeof value === "number") {
    return {
      numeric: value,
      text: formatter ? formatter(value) : value.toLocaleString(),
    };
  }
  if (value === null || value === undefined) {
    return { numeric: null, text: "" };
  }
  return { numeric: null, text: String(value) };
}

export function tooltipBarWidth(value: number, max: number): number {
  if (value <= 0 || max <= 0) {
    return 0;
  }
  return Math.min(
    TOOLTIP_BAR_TRACK,
    Math.max(
      Math.round((value / max) * TOOLTIP_BAR_TRACK),
      TOOLTIP_BAR_MIN
    )
  );
}

export function configIndicatorHtml(
  item: { indicatorHtml?: string } | undefined
): string | undefined {
  const html = item?.indicatorHtml;
  return typeof html === "string" && html.length > 0 ? html : undefined;
}

export function tooltipBarRow({
  key,
  colorsCount,
  labelText,
  valueText,
  widthPercent,
  dimmed,
  indicatorHtml,
}: {
  key: string;
  colorsCount: number;
  labelText: string;
  valueText: string;
  widthPercent: number;
  dimmed: string;
  indicatorHtml?: string;
}): string {
  return `<div class="flex w-full flex-col gap-1${dimmed}">
          <div class="flex items-center justify-between gap-4 leading-none">
            <span class="flex min-w-0 items-center gap-1.5">
              ${indicatorHtml ?? ""}
              <span class="text-muted-foreground truncate">${escapeHtml(labelText)}</span>
            </span>
            <span class="text-foreground font-mono font-medium tabular-nums">${escapeHtml(valueText)}</span>
          </div>
          <div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full" style="width:${widthPercent}%;background:${indicatorBackground(key, colorsCount)}"></div>
          </div>
        </div>`;
}

export function composeTooltipBody(
  items: readonly TooltipBodyItem[],
  layout: TooltipLayout,
  barMax?: number
): string {
  if (layout !== "bars") {
    return items
      .map((item) =>
        tooltipRow({
          indicatorHtml: tooltipIndicatorHtml(item.key, item.colorsCount),
          labelText: item.labelText,
          valueText: item.valueText,
          dimmed: item.dimmed,
        })
      )
      .join("");
  }

  let max = barMax ?? 0;
  if (barMax === undefined) {
    for (const item of items) {
      if (item.value !== null && item.value > max) {
        max = item.value;
      }
    }
  }

  const ranked = [...items];
  ranked.sort((left, right) => (right.value ?? -1) - (left.value ?? -1));
  return ranked
    .map((item) =>
      tooltipBarRow({
        key: item.key,
        colorsCount: item.colorsCount,
        labelText: item.labelText,
        valueText: item.valueText,
        widthPercent: tooltipBarWidth(item.value ?? 0, max),
        dimmed: item.dimmed,
        indicatorHtml: item.indicatorHtml,
      })
    )
    .join("");
}

// The outer tooltip surface — border, padding, shadow, roundness + variant
// classes — wrapping the axis label and the composed rows.
export function tooltipShell({
  label,
  body,
  roundness,
  variant,
  layout = "rows",
}: {
  label: string;
  body: string;
  roundness: TooltipRoundness;
  variant: TooltipVariant;
  layout?: TooltipLayout;
}): string {
  const isBars = layout === "bars";
  const header =
    label.length > 0
      ? `<div class="font-medium text-foreground">${escapeHtml(label)}</div>`
      : "";
  return `<div class="grid ${isBars ? "min-w-52 gap-2 px-2.5 py-2" : "min-w-32 gap-1.5 px-2.5 py-1.5"} items-start border border-border/50 text-xs shadow-xl ${roundnessClass[roundness]} ${tooltipVariantClass[variant]}">
      ${header}
      <div class="grid ${isBars ? "gap-2" : "gap-1.5"}">${body}</div>
    </div>`;
}

// Maps the TooltipPosition prop onto the ECharts tooltip `position` field.
// "variable" → undefined (default follow-both-axes, current behavior); "fixed" →
// a callback that centers the tooltip on the pointer's X but pins it near the
// top (fixed Y).
export function resolveTooltipPosition(
  position: TooltipPosition
): TooltipComponentOption["position"] {
  if (position === "variable") return undefined;
  return (point, _params, _dom, _rect, size) => [
    point[0] - size.contentSize[0] / 2,
    8,
  ];
}

// The chart-agnostic tooltip option fields (show, trigger, confine,
// background/border/padding/extraCssText, axisPointer, position). The chart
// supplies only `formatter` and spreads this in. `axisPointerColor` is the
// pre-resolved cursor-line color, so this helper needs no live token read.
export function tooltipBaseOption(params: {
  present: boolean;
  cursor: boolean;
  tokens: ResolvedColors["tokens"];
  position: TooltipPosition;
  axisPointerColor: string;
  strokeWidth: number;
  crosshair?: boolean;
}): TooltipComponentOption {
  const {
    present,
    cursor,
    position,
    axisPointerColor,
    strokeWidth,
    crosshair,
  } = params;

  return {
    show: present,
    trigger: "axis",
    confine: true,
    backgroundColor: "transparent",
    borderWidth: 0,
    padding: 0,
    extraCssText: "box-shadow:none;",
    axisPointer: cursor
      ? {
          type: crosshair ? "cross" : "line",
          label: { show: false },
          lineStyle: {
            color: axisPointerColor,
            width: strokeWidth,
            type: [3, 3] as [number, number],
          },
          crossStyle: {
            color: axisPointerColor,
            width: strokeWidth,
            type: [3, 3] as [number, number],
          },
        }
      : { type: "none" },
    position: resolveTooltipPosition(position),
  };
}
