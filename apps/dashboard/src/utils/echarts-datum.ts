export function echartsDatumValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (Array.isArray(value) && value.length > 0) {
    return echartsDatumValue(value.at(-1));
  }
  if (value && typeof value === "object" && "value" in value) {
    return echartsDatumValue((value as { value: unknown }).value);
  }
  return null;
}
