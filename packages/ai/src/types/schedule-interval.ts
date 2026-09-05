export interface CustomIntervalCron {
  hour: number;
  minute: number;
  /** Run every N days, counted from `anchorDate`. */
  intervalDays: number;
  /** UTC calendar date (`YYYY-MM-DD`) the interval counts from. */
  anchorDate: string;
}
