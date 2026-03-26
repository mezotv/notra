export function getObjectProperty(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null || !(key in value)) {
    return undefined;
  }

  return Reflect.get(value, key);
}

export function getStringProperty(value: unknown, key: string) {
  const property = getObjectProperty(value, key);
  return typeof property === "string" ? property : undefined;
}

export function sanitizeToken(value: unknown, maxLength = 64) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^a-zA-Z0-9._\-/:]/g, "")
    .slice(0, maxLength);

  return normalized.length > 0 ? normalized : null;
}

export function sanitizeIsoDate(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}
