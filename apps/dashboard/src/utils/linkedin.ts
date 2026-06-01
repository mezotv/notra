import { toast } from "sonner";

const LINKEDIN_FEED_URL = "https://www.linkedin.com/feed/";

export function createLinkedInPostUrl(text?: string): string {
  const url = new URL(LINKEDIN_FEED_URL);
  url.searchParams.set("shareActive", "true");
  if (text) {
    url.searchParams.set("text", text);
  }

  return url.toString();
}

export async function copyLinkedInPostToClipboard(text: string) {
  if (!navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function copyLinkedInPostForPublishing(text: string) {
  copyLinkedInPostToClipboard(text).then((copied) => {
    if (copied) {
      toast.success("Copied post to clipboard");
      return;
    }

    toast.error("Could not copy post. Copy it manually before posting.");
  });
}
