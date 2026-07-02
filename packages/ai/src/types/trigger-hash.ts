import type { TriggerCronConfig } from "../qstash/triggers";

export interface TriggerHashSourceConfig {
  eventTypes?: string[];
  includePreReleases?: boolean;
  cron?: TriggerCronConfig;
}

export interface TriggerHashTargets {
  repositoryIds: string[];
}

export interface TriggerConfigInput {
  sourceConfig: TriggerHashSourceConfig;
  targets: TriggerHashTargets;
}

export interface TriggerHashInput extends TriggerConfigInput {
  sourceType: string;
  outputType: string;
  lookbackWindow?: string;
}
