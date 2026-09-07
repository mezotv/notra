export type GeoBoxHarness = "claude-code" | "codex" | "opencode";

export interface GeoBoxRunTarget {
  harness: GeoBoxHarness;
  model: string;
}

export interface GeoOpenCodeBoxRetryOptions {
  attempts?: number;
  retryNotFound?: boolean;
  retryDelayMs?: number;
  signal?: AbortSignal;
}

export interface GeoOpenCodeStaleBoxCandidate {
  created_at: number;
  name?: string;
}
