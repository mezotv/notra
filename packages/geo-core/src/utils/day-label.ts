const dayLabelFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDayLabel(day: string): string {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return day;
  }
  return dayLabelFormatter.format(date);
}
