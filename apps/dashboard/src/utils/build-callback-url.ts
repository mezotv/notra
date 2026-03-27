export function buildCallbackUrl(
  baseUrl: string,
  callbackPath: string | undefined,
  params: Record<string, string>
): string {
  const rawPath = callbackPath || "/";
  const safePath =
    rawPath.startsWith("/") && !rawPath.startsWith("//") ? rawPath : "/";
  const separator = safePath.includes("?") ? "&" : "?";
  const query = new URLSearchParams(params).toString();
  return `${baseUrl}${safePath}${separator}${query}`;
}
