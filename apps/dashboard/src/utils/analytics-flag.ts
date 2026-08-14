export function isAnalyticsVisibleInNav(flagOn: boolean): boolean {
  return flagOn || process.env.NODE_ENV === "development";
}
