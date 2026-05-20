import { FORMAT_CARD_META } from "@/constants/content-formats";
import { DEFAULT_SCHEDULE, FREQUENCY_LABELS } from "@/constants/schedule";
import type { CronFrequency, ScheduleOutputType } from "@/schemas/integrations";
import type { ScheduleFormValues } from "@/types/automation/schedule";
import type { Trigger } from "@/types/triggers/triggers";

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

export function padTimeUnit(value: number): string {
  return value.toString().padStart(2, "0");
}

export function parseTimeValue(
  time: string
): { hour: number; minute: number } | null {
  const match = TIME_PATTERN.exec(time);
  if (!match) {
    return null;
  }
  const hour = Number.parseInt(match[1] ?? "", 10);
  const minute = Number.parseInt(match[2] ?? "", 10);
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

export function formatTimeValue(hour: number, minute: number): string {
  return `${padTimeUnit(hour)}:${padTimeUnit(minute)}`;
}

export function getDefaultScheduleValues(
  editTrigger?: Trigger
): ScheduleFormValues {
  if (editTrigger) {
    const supportedType: ScheduleOutputType =
      editTrigger.outputType === "investor_update"
        ? "changelog"
        : (editTrigger.outputType as ScheduleOutputType);
    return {
      name: editTrigger.name ?? "",
      outputType: supportedType,
      schedule: editTrigger.sourceConfig.cron ?? DEFAULT_SCHEDULE,
      repositoryIds: editTrigger.targets.repositoryIds,
      lookbackWindow: editTrigger.lookbackWindow ?? "last_7_days",
      brandVoiceId:
        editTrigger.outputConfig?.brandVoiceId &&
        editTrigger.outputConfig.brandVoiceId !== "__default__"
          ? editTrigger.outputConfig.brandVoiceId
          : "",
      autoPublish: editTrigger.autoPublish ?? false,
    };
  }
  return {
    name: "",
    outputType: "changelog",
    schedule: DEFAULT_SCHEDULE,
    repositoryIds: [],
    lookbackWindow: "last_7_days",
    brandVoiceId: "",
    autoPublish: false,
  };
}

export function buildAutoScheduleName(
  frequency: CronFrequency,
  outputType: ScheduleOutputType
): string {
  const typeLabel = FORMAT_CARD_META[outputType].label.toLowerCase();
  return `${FREQUENCY_LABELS[frequency]} ${typeLabel}`;
}
