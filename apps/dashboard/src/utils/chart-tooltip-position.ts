// Tight offset so the box tracks the cursor without sitting on the hover line.
const TOOLTIP_POINTER_GAP = 12;
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

/**
 * Sit beside the hover line. Prefer the side with more room so the box does
 * not flip back and forth near the edge — it only switches at the midpoint.
 */
function sideOffsetTooltipX(
  pointerX: number,
  tooltipWidth: number,
  viewWidth: number
): number {
  const rightX = pointerX + TOOLTIP_POINTER_GAP;
  const leftX = pointerX - tooltipWidth - TOOLTIP_POINTER_GAP;
  const rightFits = rightX + tooltipWidth <= viewWidth;
  const leftFits = leftX >= 0;

  let x = rightX;
  if (rightFits && leftFits) {
    x = viewWidth - pointerX >= pointerX ? rightX : leftX;
  } else if (leftFits && !rightFits) {
    x = leftX;
  }

  return clampTooltipX(x, tooltipWidth, viewWidth);
}

/** Pin near the top and sit beside the pointer X, without covering the hover line. */
export function fixedTooltipPosition(
  pointerX: number,
  tooltipWidth: number,
  viewWidth: number
): [number, number] {
  return [
    sideOffsetTooltipX(pointerX, tooltipWidth, viewWidth),
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

  return [
    sideOffsetTooltipX(pointerX, tooltipWidth, viewSize[0]),
    pointerY - tooltipHeight - TOOLTIP_POINTER_GAP,
  ];
}
