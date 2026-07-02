import crypto from "node:crypto";
import { normalizeCronConfig } from "../qstash/triggers";
import type {
  TriggerConfigInput,
  TriggerHashInput,
} from "../types/trigger-hash";

export function normalizeTriggerConfig({
  sourceConfig,
  targets,
}: TriggerConfigInput) {
  const eventTypes = sourceConfig.eventTypes
    ? [...sourceConfig.eventTypes].sort()
    : sourceConfig.eventTypes;
  const repositoryIds = [...targets.repositoryIds].sort();
  const cron = normalizeCronConfig(sourceConfig.cron);

  return {
    sourceConfig: {
      ...sourceConfig,
      eventTypes,
      cron,
    },
    targets: {
      repositoryIds,
    },
  };
}

export function hashTrigger({
  sourceType,
  sourceConfig,
  targets,
  outputType,
  lookbackWindow,
}: TriggerHashInput) {
  const normalized = normalizeTriggerConfig({ sourceConfig, targets });
  const payload = JSON.stringify({
    sourceType,
    sourceConfig: normalized.sourceConfig,
    targets: normalized.targets,
    outputType,
    lookbackWindow,
  });

  return crypto.createHash("sha256").update(payload).digest("hex");
}
