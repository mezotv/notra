export function shouldBypassAutumnInDevelopment(
  nodeEnv: string | undefined,
  secretKey: string | undefined
): boolean {
  return nodeEnv === "development" && !secretKey;
}
