const TRAILING_ZERO_REGEX = /\.0$/;

export function formatCompactNumber(num: number) {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(TRAILING_ZERO_REGEX, "")}K`;
  }
  return String(num);
}
