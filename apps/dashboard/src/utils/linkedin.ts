const LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/";

export function createLinkedInPostUrl(text: string): string {
  const url = new URL(LINKEDIN_FEED_URL);
  url.searchParams.set("shareActive", "true");
  url.searchParams.set("text", text);

  return url.toString();
}
