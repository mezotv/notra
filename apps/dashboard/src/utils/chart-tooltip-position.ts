// Match ECharts' default tooltip offset (`refixTooltipPosition` uses 20).
const TOOLTIP_POINTER_GAP = 20;
const FIXED_TOOLTIP_Y = 8;

function clamp(value: number, min: number, max: number): number {
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
}

function clampTooltipX(
  x: number,
  tooltipWidth: number,
  viewWidth: number
): number {
  return clamp(x, 0, Math.max(0, viewWidth - tooltipWidth));
}

/** Pin near the top and center on the pointer X, without leaving the chart. */
export function fixedTooltipPosition(
  pointerX: number,
  tooltipWidth: number,
  viewWidth: number
): [number, number] {
  return [
    clampTooltipX(pointerX - tooltipWidth / 2, tooltipWidth, viewWidth),
    FIXED_TOOLTIP_Y,
  ];
}

/**
 * Follow the pointer, but never slide past the chart's left/right edge.
 * Y may go negative so short sparklines can paint the box above the plot.
 */
export function overflowTooltipPosition(
  pointer: readonly [number, number],
  contentSize: readonly [number, number],
  viewSize: readonly [number, number]
): [number, number] {
  const [pointerX, pointerY] = pointer;
  const [tooltipWidth, tooltipHeight] = contentSize;
  const viewWidth = viewSize[0];

  let x = pointerX + TOOLTIP_POINTER_GAP;
  // ECharts adds 2px so a right-edge box does not wrap its value column.
  if (pointerX + tooltipWidth + TOOLTIP_POINTER_GAP + 2 > viewWidth) {
    x = pointerX - tooltipWidth - TOOLTIP_POINTER_GAP;
  }

  return [
    clampTooltipX(x, tooltipWidth, viewWidth),
    pointerY - tooltipHeight - TOOLTIP_POINTER_GAP,
  ];
}
