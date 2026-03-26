export function createTwitterPostUrl(text: string): string {
  const url = new URL("https://x.com/intent/tweet");
  url.searchParams.set("text", text.trim());

  return url.toString();
}
