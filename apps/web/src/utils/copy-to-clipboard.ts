import { toast } from "sonner";

export async function copyToClipboard(text: string, successMessage: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Failed to copy to clipboard");
  }
}
