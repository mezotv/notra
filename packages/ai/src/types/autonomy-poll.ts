export interface IrisPollItem {
  source: string;
  kind: string;
  dedupeHash: string;
  sourceEventId: string | null;
  occurredAt: Date;
  title: string;
  url: string | null;
  payload: Record<string, unknown>;
}

export interface IrisSourcePollResult {
  source: string;
  items: IrisPollItem[];
  skippedReason: string | null;
}

export interface PollIrisSourcesInput {
  organizationId: string;
  lookbackHours?: number;
}

export interface IrisPollSourceSummary {
  source: string;
  itemCount: number;
  recordedCount: number;
  deduplicatedCount: number;
  skippedReason: string | null;
}

export interface PollIrisSourcesResult {
  recordedCount: number;
  deduplicatedCount: number;
  digest: string;
  sources: IrisPollSourceSummary[];
}

export interface IrisPollWindow {
  organizationId: string;
  since: Date;
}

export interface IrisPollDigestInput {
  lookbackHours: number;
  generatedAt: Date;
  sources: readonly IrisSourcePollResult[];
}

export interface IrisPollRepository {
  id: string;
  owner: string | null;
  repo: string | null;
  defaultBranch: string | null;
}
