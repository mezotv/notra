export function formatSnakeCaseLabel(value: string): string {
  return value.replaceAll("_", " ").trim();
}

export function formatRelativeTime(date: Date, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - date.getTime()) / 1000));
  if (seconds < 10) {
    return "Saved just now";
  }

  if (seconds < 60) {
    return "Saved seconds ago";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes === 1) {
    return "Saved 1 min ago";
  }

  if (minutes < 60) {
    return `Saved ${minutes} min ago`;
  }

  return "Saved over an hour ago";
}

export function truncateText(value: string, maxLength: number): string {
  if (maxLength <= 0) {
    return "";
  }

  if (value.length <= maxLength) {
    return value;
  }

  const hiddenCharacters = value.length - maxLength;
  if (hiddenCharacters <= 3) {
    return value;
  }

  return `${value.slice(0, maxLength)}…`;
}
