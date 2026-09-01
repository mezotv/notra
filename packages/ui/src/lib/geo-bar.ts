const PERCENT_SCALE = 100;
const MIN_BAR_PERCENT = 2;

export function barWidthPercent(value: number, max: number): number {
  if (max <= 0 || value <= 0) {
    return 0;
  }
  return Math.max((value / max) * PERCENT_SCALE, MIN_BAR_PERCENT);
}
