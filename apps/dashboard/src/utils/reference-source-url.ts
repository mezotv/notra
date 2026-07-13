export function getSafeReferenceSourceUrl(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}
