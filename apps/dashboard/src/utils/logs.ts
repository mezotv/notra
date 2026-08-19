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

export function formatLogTimestamp(
  dateString: string,
  style: "short" | "long" = "short"
) {
  const options: Intl.DateTimeFormatOptions =
    style === "long"
      ? {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        };

  return new Intl.DateTimeFormat(undefined, options).format(
    new Date(dateString)
  );
}
