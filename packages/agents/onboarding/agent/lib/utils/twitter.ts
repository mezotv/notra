export function getTwitterHeaders(): Record<string, string> {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN?.trim();
  if (!bearerToken) {
    throw new Error("TWITTER_BEARER_TOKEN is not configured");
  }
  return { Authorization: `Bearer ${bearerToken}` };
}
