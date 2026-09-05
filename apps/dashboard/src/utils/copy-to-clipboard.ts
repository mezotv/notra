import { toast } from "sonner";

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
}

export async function copyTextToClipboard(
  text: string,
  successMessage: string
): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    toast.error("Clipboard not supported");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    toast.error("Failed to copy to clipboard");
    return;
  }
  toast.success(successMessage);
}
