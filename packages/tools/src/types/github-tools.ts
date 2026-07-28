export interface ErrorWithResponseStatus {
  status?: number;
  message?: string;
  response?: {
    headers?: Record<string, string | number | undefined>;
  };
}

export interface GenerationCommitWindow {
  since?: string;
  until?: string;
}

export interface GenerationSelectionFilters {
  allowedPullRequestNumbersByIntegrationId?: Record<string, number[]>;
  allowedReleaseTagsByIntegrationId?: Record<string, string[]>;
  allowedReleaseTagsGlobal?: string[];
  allowedCommitShas?: string[];
}

export interface GenerationDataPointSettings {
  includePullRequests?: boolean;
  includeReleases?: boolean;
  includeCommits?: boolean;
  includeLinearData?: boolean;
}

export interface GenerationConfig {
  selectionFilters?: GenerationSelectionFilters;
  commitWindow?: GenerationCommitWindow;
  dataPointSettings?: GenerationDataPointSettings;
}
