export function stackSegmentGapValues(
  seriesValues: readonly (readonly number[])[],
  gapUnits: number
): number[][] {
  const gapCount = Math.max(seriesValues.length - 1, 0);
  const rowCount = seriesValues[0]?.length ?? 0;
  const gaps: number[][] = [];

  for (let seriesIndex = 0; seriesIndex < gapCount; seriesIndex++) {
    const rowGaps: number[] = [];
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
      const current = seriesValues[seriesIndex]?.[rowIndex] ?? 0;
      if (current <= 0) {
        rowGaps.push(0);
        continue;
      }
      let hasLater = false;
      for (
        let laterIndex = seriesIndex + 1;
        laterIndex < seriesValues.length;
        laterIndex++
      ) {
        if ((seriesValues[laterIndex]?.[rowIndex] ?? 0) > 0) {
          hasLater = true;
          break;
        }
      }
      rowGaps.push(hasLater ? gapUnits : 0);
    }
    gaps.push(rowGaps);
  }

  return gaps;
}
