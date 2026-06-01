export type PreviewCacheKind = "commits" | "prs" | "releases" | "issues";
export type PreviewCacheSource = "repo" | "linear";

export interface PreviewCacheEntry<T extends unknown[]> {
  data: T;
  fetchedAt: number;
  staleAt: number;
  version: number;
}
