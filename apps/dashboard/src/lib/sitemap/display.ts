export function getStatusCodeClassName(statusCode: number | null): string {
  if (statusCode === null) {
    return "text-muted-foreground";
  }
  if (statusCode >= 200 && statusCode < 300) {
    return "text-emerald-600 dark:text-emerald-400";
  }
  if (statusCode >= 300 && statusCode < 400) {
    return "text-amber-600 dark:text-amber-400";
  }
  return "text-red-600 dark:text-red-400";
}

export function formatWordCount(wordCount: number | null): string {
  if (wordCount === null) {
    return "—";
  }
  return `${wordCount.toLocaleString()} words`;
}

export function formatTextRatio(textRatio: number | null): string | null {
  if (textRatio === null) {
    return null;
  }
  return `${Math.round(textRatio * 100)}% text ratio`;
}
