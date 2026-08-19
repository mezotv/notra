const PAD_LENGTH = 2;

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, "0");
}

export function toClickHouseDateTime(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )}`;
}

export function parseClickHouseDateTime(value: string): Date {
  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;
  return new Date(normalized);
}
