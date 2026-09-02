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
