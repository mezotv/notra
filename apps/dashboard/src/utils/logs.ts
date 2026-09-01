import {
  SOURCE_LABELS,
  SOURCE_VALUES,
  STATUS_LABELS,
  STATUS_VALUES,
} from "@/constants/logs";

export function getSourceLabel(value: string) {
  const match = SOURCE_VALUES.find((option) => option === value);
  return match ? SOURCE_LABELS[match] : value;
}

export function getStatusLabel(value: string) {
  const match = STATUS_VALUES.find((option) => option === value);
  return match ? STATUS_LABELS[match] : value;
}

const SHORT_LOG_TIMESTAMP_FORMAT = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const LONG_LOG_TIMESTAMP_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatLogTimestamp(
  dateString: string,
  style: "short" | "long" = "short"
) {
  const formatter =
    style === "long" ? LONG_LOG_TIMESTAMP_FORMAT : SHORT_LOG_TIMESTAMP_FORMAT;
  return formatter.format(new Date(dateString));
}
